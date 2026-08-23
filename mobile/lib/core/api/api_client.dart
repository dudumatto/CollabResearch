import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../config/env.dart';
import '../navigation/navigation_service.dart';
import 'api_endpoints.dart';

class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiUrl,
        headers: const {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _cachedToken ?? await _storage.read(key: _tokenKey);
          _cachedToken = token;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (kDebugMode) {
            debugPrint(
              'API ${error.requestOptions.method} ${error.requestOptions.uri} '
              '-> ${error.response?.statusCode}: ${error.response?.data}',
            );
          }
          if (error.response?.statusCode == 401 && !_isLoginRequest(error)) {
            await clearToken();
            await onUnauthorized?.call();
            final navigatorState =
                NavigationService.rootNavigatorKey.currentState;
            if (navigatorState != null && navigatorState.mounted) {
              navigatorState.context.go('/login');
            }
            handler.reject(
              DioException(
                requestOptions: error.requestOptions,
                error: 'Sessao expirada. Entre novamente.',
                response: error.response,
                type: error.type,
              ),
            );
            return;
          }
          handler.reject(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();
  static const String _tokenKey = 'auth_token';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  late final Dio _dio;
  String? _cachedToken;

  Future<void> Function()? onUnauthorized;

  Dio get dio => _dio;

  Future<void> saveToken(String token) async {
    _cachedToken = token;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> readToken() async {
    _cachedToken ??= await _storage.read(key: _tokenKey);
    return _cachedToken;
  }

  Future<void> clearToken() async {
    _cachedToken = null;
    await _storage.delete(key: _tokenKey);
  }

  String friendlyError(DioException error) {
    final status = error.response?.statusCode;
    if (_isLoginRequest(error) && (status == 400 || status == 401)) {
      return 'Credenciais invalidas.';
    }
    if (status == 400) {
      return _backendMessage(error.response?.data) ??
          'Dados invalidos. Verifique os campos.';
    }
    if (status == 401) return 'Sessao expirada. Entre novamente.';
    if (status == 403) return 'Voce nao tem permissao para esta acao.';
    if (status == 404) return 'Recurso nao encontrado.';
    if (status == 409) {
      return _backendMessage(error.response?.data) ??
          'Ja existe um registro com esses dados.';
    }
    if (status != null && status >= 500) {
      return 'Erro no servidor. Tente novamente.';
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'Tempo limite excedido. Verifique sua conexao.';
    }
    return 'Nao foi possivel concluir a operacao.';
  }

  String? _backendMessage(dynamic data) {
    if (data is String && data.trim().isNotEmpty) return data.trim();
    if (data is! Map) return null;

    final errors = data['errors'] ?? data['erros'];
    if (errors is Map && errors.isNotEmpty) {
      return errors.values.map((value) => '$value').join('\n');
    }
    if (errors is List && errors.isNotEmpty) {
      return errors.map((value) {
        if (value is Map) {
          return value['message'] ?? value['mensagem'] ?? '$value';
        }
        return '$value';
      }).join('\n');
    }

    final message = data['message'] ?? data['mensagem'] ?? data['erro'];
    if (message is String && message.trim().isNotEmpty) {
      return message.trim();
    }
    return null;
  }

  bool _isLoginRequest(DioException error) {
    final path = error.requestOptions.path;
    return path == ApiEndpoints.login || path.endsWith(ApiEndpoints.login);
  }
}
