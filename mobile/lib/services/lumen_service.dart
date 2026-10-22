import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/lumen_recommendation.dart';
import 'response_parser.dart';

class LumenService {
  LumenService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  /// Ultima analise salva (sem chamar a IA). Backend responde 204 se nao houver.
  Future<LumenResult> latest() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.lumenRecommend);
    return LumenResult.fromJson(parseObjectPayload(response.data));
  }

  /// Chama a IA; pode demorar (timeout do backend: 45s).
  Future<LumenResult> analyze() async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.lumenRecommend,
      options: Options(receiveTimeout: const Duration(seconds: 60)),
    );
    return LumenResult.fromJson(parseObjectPayload(response.data));
  }

  /// Orientador: nota 0-10 das inscricoes pendentes do projeto. [ids] vazio
  /// avalia todas as pendentes sem nota; o backend salva o resultado.
  Future<List<LumenCandidate>> rank(
    String projectId, {
    List<String> ids = const [],
  }) async {
    Future<Response<dynamic>> post() => _dio.post<dynamic>(
          ApiEndpoints.lumenRank(projectId),
          data: ids.isEmpty
              ? null
              : {
                  'inscricaoIds':
                      ids.map((e) => int.tryParse(e) ?? e).toList(),
                },
          options: Options(receiveTimeout: const Duration(seconds: 120)),
        );
    // Sem resposta HTTP (o navegador mostra como erro de CORS) = o gateway
    // derrubou a chamada, em geral o servidor acordando. O backend guarda as
    // notas ja calculadas, entao repetir uma vez e seguro.
    Response<dynamic> response;
    try {
      response = await post();
    } on DioException catch (error) {
      if (error.type != DioExceptionType.connectionError ||
          error.response != null) {
        rethrow;
      }
      await Future<void>.delayed(const Duration(seconds: 3));
      response = await post();
    }
    final json = parseObjectPayload(response.data);
    final items = json['ranking'];
    if (items is! List || items.isEmpty) {
      throw LumenEmptyRanking(json['aviso'] as String?);
    }
    return items
        .whereType<Map>()
        .map((e) => LumenCandidate.fromJson(e.map((k, v) => MapEntry('$k', v))))
        .toList();
  }
}

class LumenEmptyRanking implements Exception {
  const LumenEmptyRanking(this.notice);
  final String? notice;
}
