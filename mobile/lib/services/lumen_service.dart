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
}
