import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/academic_workspace.dart';
import '../models/conversation.dart';
import '../models/project.dart';
import '../models/subscription.dart';
import '../models/user.dart';
import 'response_parser.dart';

class AcademicWorkspaceService {
  AcademicWorkspaceService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<ProjectStage>> stages(String projectId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectStages(projectId));
    return parseListPayload(response.data).map(ProjectStage.fromJson).toList()
      ..sort((a, b) => a.order.compareTo(b.order));
  }

  Future<ProjectStage> saveStage(
    String projectId,
    Map<String, dynamic> data, {
    String? stageId,
  }) async {
    final response = stageId == null
        ? await _dio.post<dynamic>(
            ApiEndpoints.projectStages(projectId),
            data: data,
          )
        : await _dio.put<dynamic>(
            ApiEndpoints.projectStage(projectId, stageId),
            data: data,
          );
    return ProjectStage.fromJson(parseObjectPayload(response.data));
  }

  Future<ProjectStage> completeStage(String projectId, String stageId) async {
    final response = await _dio.patch<dynamic>(
      ApiEndpoints.projectStage(projectId, stageId),
      data: const {'status': 'DONE'},
    );
    return ProjectStage.fromJson(parseObjectPayload(response.data));
  }

  Future<void> deleteStage(String projectId, String stageId) =>
      _dio.delete<dynamic>(
        ApiEndpoints.projectStage(projectId, stageId),
      );

  Future<List<DeliveryItem>> deliveries(String projectId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectDeliveries(projectId));
    return parseListPayload(response.data).map(DeliveryItem.fromJson).toList();
  }

  Future<DeliveryItem> createDelivery({
    required String projectId,
    required String title,
    required String category,
    required PlatformFile file,
    String? stageId,
  }) async {
    final bytes = file.bytes;
    if (bytes == null) throw StateError('Arquivo sem conteudo disponivel.');
    final response = await _dio.post<dynamic>(
      ApiEndpoints.projectDeliveries(projectId),
      data: FormData.fromMap({
        'titulo': title,
        'categoria': category,
        if (stageId != null) 'etapaId': stageId,
        'arquivo': MultipartFile.fromBytes(bytes, filename: file.name),
      }),
    );
    return DeliveryItem.fromJson(parseObjectPayload(response.data));
  }

  Future<DeliveryItem> resubmitDelivery({
    required String projectId,
    required String deliveryId,
    required PlatformFile file,
  }) async {
    final bytes = file.bytes;
    if (bytes == null) throw StateError('Arquivo sem conteudo disponivel.');
    final response = await _dio.post<dynamic>(
      ApiEndpoints.deliveryVersions(projectId, deliveryId),
      data: FormData.fromMap({
        'arquivo': MultipartFile.fromBytes(bytes, filename: file.name),
      }),
    );
    return DeliveryItem.fromJson(parseObjectPayload(response.data));
  }

  Future<List<DeliveryVersion>> deliveryVersions(
    String projectId,
    String deliveryId,
  ) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.deliveryVersions(projectId, deliveryId),
    );
    return parseListPayload(response.data)
        .map(DeliveryVersion.fromJson)
        .toList()
      ..sort((a, b) => b.number.compareTo(a.number));
  }

  Future<void> reviewDelivery({
    required String projectId,
    required String deliveryId,
    required String versionId,
    required String decision,
    String? comment,
  }) =>
      _dio.post<dynamic>(
        ApiEndpoints.reviewDeliveryVersion(
          projectId,
          deliveryId,
          versionId,
        ),
        data: {'decisao': decision, 'comentario': comment},
      );

  Future<List<AcademicEvaluation>> evaluations(String projectId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectEvaluations(projectId));
    return parseListPayload(response.data)
        .map(AcademicEvaluation.fromJson)
        .toList();
  }

  Future<AcademicEvaluation> saveEvaluation({
    required String projectId,
    required Map<String, dynamic> data,
    String? evaluationId,
  }) async {
    final response = evaluationId == null
        ? await _dio.post<dynamic>(
            ApiEndpoints.projectEvaluations(projectId),
            data: data,
          )
        : await _dio.patch<dynamic>(
            ApiEndpoints.projectEvaluation(projectId, evaluationId),
            data: data,
          );
    return AcademicEvaluation.fromJson(parseObjectPayload(response.data));
  }

  Future<AcademicEvaluation> acknowledgeEvaluation(
    String projectId,
    String evaluationId,
    String? comment,
  ) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.acknowledgeEvaluation(projectId, evaluationId),
      data: {'comentarioAluno': comment},
    );
    return AcademicEvaluation.fromJson(parseObjectPayload(response.data));
  }

  Future<AdvisorDashboard> advisorDashboard() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.advisorDashboard());
    return AdvisorDashboard.fromJson(parseObjectPayload(response.data));
  }

  Future<List<Subscription>> advisorApplications({
    String? status,
    String? projectId,
  }) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.advisorApplications(),
      queryParameters: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (projectId != null && projectId.isNotEmpty) 'projetoId': projectId,
      },
    );
    return parseListPayload(response.data).map(Subscription.fromJson).toList();
  }

  Future<List<Subscription>> projectApplications(String projectId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.projectApplications(projectId));
    return parseListPayload(response.data).map(Subscription.fromJson).toList();
  }

  Future<List<AdviseeSummary>> advisees({String? search}) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.advisees(),
      queryParameters: {
        if (search != null && search.isNotEmpty) 'busca': search,
      },
    );
    return parseListPayload(response.data)
        .map(AdviseeSummary.fromJson)
        .toList();
  }

  Future<AdviseeDetail> advisee(
    String studentId, {
    String? projectId,
  }) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.advisee(studentId),
      queryParameters: {
        if (projectId != null && projectId.isNotEmpty) 'projectId': projectId,
      },
    );
    return AdviseeDetail.fromJson(parseObjectPayload(response.data));
  }

  Future<List<AcademicDocument>> documents(String userId) async {
    final response =
        await _dio.get<dynamic>(ApiEndpoints.userDocuments(userId));
    return parseListPayload(response.data)
        .map(AcademicDocument.fromJson)
        .toList();
  }

  Future<void> deleteDocument(String id) =>
      _dio.delete<dynamic>(ApiEndpoints.document(id));

  Future<User> userProfile(String id) async {
    final response = await _dio.get<dynamic>(ApiEndpoints.userProfile(id));
    return User.fromJson(parseObjectPayload(response.data));
  }

  Future<List<Project>> userProjects(String id) async {
    final response = await _dio.get<dynamic>(ApiEndpoints.userProjects(id));
    return parseListPayload(response.data).map(Project.fromJson).toList();
  }

  Future<Conversation> openProjectConversation(String projectId) async {
    final response =
        await _dio.post<dynamic>(ApiEndpoints.projectConversation(projectId));
    return Conversation.fromJson(parseObjectPayload(response.data));
  }
}
