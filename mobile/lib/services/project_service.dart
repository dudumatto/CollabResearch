import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/project.dart';
import 'response_parser.dart';

class ProjectService {
  ProjectService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<Project>> list({
    String? status,
    String? area,
    String? course,
    String? search,
  }) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.projects,
      queryParameters: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (area != null && area.isNotEmpty) 'area': area,
        if (course != null && course.isNotEmpty) 'curso': course,
        if (search != null && search.isNotEmpty) 'busca': search,
      },
    );
    return parseListPayload(response.data).map(Project.fromJson).toList();
  }

  Future<Project> getById(String id) async {
    final response = await _dio.get<dynamic>(ApiEndpoints.project(id));
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> create(Map<String, dynamic> data) async {
    final response = await _dio.post<dynamic>(ApiEndpoints.projects, data: data);
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> update(String id, Map<String, dynamic> data) async {
    final response = await _dio.put<dynamic>(ApiEndpoints.project(id), data: data);
    return Project.fromJson(parseObjectPayload(response.data));
  }
}
