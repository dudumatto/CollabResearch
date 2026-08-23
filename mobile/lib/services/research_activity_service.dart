import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/feedback_entry.dart';
import '../models/progress_entry.dart';
import '../models/project.dart';
import 'response_parser.dart';

class ResearchActivityService {
  ResearchActivityService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<Project>> listRelatedProjects() async {
    final response = await _dio.get<dynamic>(
      '${ApiEndpoints.projects}/pagina',
      queryParameters: const {'meusProjetos': true, 'size': 100},
    );
    return parseListPayload(response.data).map(Project.fromJson).toList();
  }

  Future<List<ProgressEntry>> listProgress(String projectId) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.projectProgress(projectId),
    );
    return parseListPayload(response.data).map(ProgressEntry.fromJson).toList();
  }

  Future<ProgressEntry> createProgress(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.projectProgress(projectId),
      data: data,
    );
    return ProgressEntry.fromJson(parseObjectPayload(response.data));
  }

  Future<List<FeedbackEntry>> listFeedback(String projectId) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.projectFeedback(projectId),
    );
    return parseListPayload(response.data).map(FeedbackEntry.fromJson).toList();
  }

  Future<FeedbackEntry> createFeedback(Map<String, dynamic> data) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.feedback,
      data: data,
    );
    return FeedbackEntry.fromJson(parseObjectPayload(response.data));
  }
}
