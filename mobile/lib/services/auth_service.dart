import 'package:dio/dio.dart';

import '../core/auth/auth_service.dart';
import '../core/api/api_client.dart';

class AuthRepository {
  AuthRepository() : _service = AuthService(ApiClient.instance);

  final AuthService _service;

  Future<Response<dynamic>> login(String email, String password) {
    return _service.login({'email': email, 'senha': password});
  }

  Future<Response<dynamic>> register(Map<String, dynamic> data) {
    return _service.register(data);
  }

  Future<Response<dynamic>> logout() {
    return _service.logout();
  }

  Future<Response<dynamic>> me() {
    return _service.me();
  }

  Future<Response<dynamic>> changePassword(
    String currentPassword,
    String newPassword,
  ) {
    return _service.changePassword({
      'senhaAtual': currentPassword,
      'novaSenha': newPassword,
    });
  }

  Future<Response<dynamic>> updateProfile(
      String id, Map<String, dynamic> data) {
    return _service.updateProfile(id, data);
  }

  Future<Response<dynamic>> updatePreferences({
    required bool notificationsEnabled,
    required String theme,
  }) {
    return _service.updatePreferences({
      'notificacoesAtivas': notificationsEnabled,
      'tema': theme,
    });
  }
}
