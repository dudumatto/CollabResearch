import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/project.dart';
import '../models/user.dart';
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

  Future<ProjectPage> listPage({
    String? status,
    String? area,
    String? course,
    String? search,
    bool mine = false,
    int page = 0,
    int size = 10,
  }) async {
    final response = await _dio.get<dynamic>(
      '${ApiEndpoints.projects}/pagina',
      queryParameters: {
        'page': page,
        'size': size,
        'sort': 'dataCriacao',
        'direction': 'DESC',
        if (mine) 'meusProjetos': true,
        if (status != null && status.isNotEmpty) 'status': status,
        if (area != null && area.isNotEmpty) 'area': area,
        if (course != null && course.isNotEmpty) 'curso': course,
        if (search != null && search.isNotEmpty) 'busca': search,
      },
    );
    return ProjectPage.fromPayload(response.data);
  }

  Future<Project> getById(String id) async {
    final response = await _dio.get<dynamic>(ApiEndpoints.project(id));
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> create(Map<String, dynamic> data) async {
    final response =
        await _dio.post<dynamic>(ApiEndpoints.projects, data: data);
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> update(String id, Map<String, dynamic> data) async {
    final response =
        await _dio.put<dynamic>(ApiEndpoints.project(id), data: data);
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<List<ProjectOption>> listAreas() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.researchAreas);
    return parseListPayload(response.data).map(ProjectOption.fromJson).toList();
  }

  Future<List<ProjectOption>> listAdvisors() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.advisors);
    return parseListPayload(response.data).map(ProjectOption.fromJson).toList();
  }

  Future<Project> acceptOrientation(String id) async {
    final response = await _dio.put<dynamic>(
      ApiEndpoints.acceptProjectOrientation(id),
    );
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> rejectOrientation(String id) async {
    final response = await _dio.put<dynamic>(
      ApiEndpoints.rejectProjectOrientation(id),
    );
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<Project> updateStatus(String id, String status) async {
    final response = await _dio.patch<dynamic>(
      ApiEndpoints.projectStatus(id),
      data: {'status': status},
    );
    return Project.fromJson(parseObjectPayload(response.data));
  }

  Future<void> delete(String id) async {
    await _dio.delete<dynamic>(ApiEndpoints.project(id));
  }

  Future<List<User>> listCollaborators(String id) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectCollaborators(id));
    return parseListPayload(response.data).map(User.fromJson).toList();
  }

  Future<void> removeCollaborator(String projectId, String userId) async {
    await _dio.delete<dynamic>(
      ApiEndpoints.projectCollaborator(projectId, userId),
    );
  }
}
