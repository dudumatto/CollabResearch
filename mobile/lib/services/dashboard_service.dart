import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/dashboard_summary.dart';
import 'response_parser.dart';

class DashboardService {
  DashboardService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<DashboardSummary> load() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.dashboard);
    return DashboardSummary.fromJson(parseObjectPayload(response.data));
  }
}
