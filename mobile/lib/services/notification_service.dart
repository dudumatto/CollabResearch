import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/app_notification.dart';
import 'response_parser.dart';

class NotificationService {
  NotificationService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<AppNotification>> list() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.notifications);
    return parseListPayload(response.data)
        .map(AppNotification.fromJson)
        .toList();
  }

  Future<void> markAllAsRead() async {
    await _dio.put<dynamic>(ApiEndpoints.readAllNotifications());
  }

  Future<AppNotification> markAsRead(String id) async {
    final response = await _dio.put<dynamic>(ApiEndpoints.readNotification(id));
    return AppNotification.fromJson(parseObjectPayload(response.data));
  }
}
