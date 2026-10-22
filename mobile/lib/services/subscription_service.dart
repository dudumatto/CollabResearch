import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/subscription.dart';
import 'response_parser.dart';

class SubscriptionService {
  SubscriptionService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<Subscription>> list() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.subscriptions);
    return parseListPayload(response.data).map(Subscription.fromJson).toList();
  }

  Future<Subscription> create(
    String projectId, {
    String? motivation,
  }) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.subscriptions,
      data: {
        'projetoId': projectId,
        if (motivation != null && motivation.trim().isNotEmpty)
          'motivacao': motivation.trim(),
      },
    );
    return Subscription.fromJson(parseObjectPayload(response.data));
  }

  Future<List<Subscription>> listByProject(String projectId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectApplications(projectId));
    return parseListPayload(response.data).map(Subscription.fromJson).toList();
  }

  /// Inscricoes de todos os projetos do orientador (mesma fonte do web).
  Future<List<Subscription>> listForAdvisor() async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.advisorApplications());
    return parseListPayload(response.data).map(Subscription.fromJson).toList();
  }

  Future<Subscription> approve(String id, {String? opinion}) async {
    final response = await _dio.put<dynamic>(
      ApiEndpoints.approveSubscription(id),
      data: _opinionBody(opinion),
    );
    return Subscription.fromJson(parseObjectPayload(response.data));
  }

  Future<Subscription> reject(String id, {String? opinion}) async {
    final response = await _dio.put<dynamic>(
      ApiEndpoints.rejectSubscription(id),
      data: _opinionBody(opinion),
    );
    return Subscription.fromJson(parseObjectPayload(response.data));
  }

  Future<void> cancel(String id) async {
    await _dio.delete<dynamic>(ApiEndpoints.cancelSubscription(id));
  }

  Map<String, dynamic>? _opinionBody(String? opinion) {
    final text = opinion?.trim() ?? '';
    return text.isEmpty ? null : {'parecerOrientador': text};
  }
}
