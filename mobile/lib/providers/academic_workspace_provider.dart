import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/academic_workspace.dart';
import '../models/project.dart';
import '../models/subscription.dart';
import '../models/user.dart';
import '../services/academic_workspace_service.dart';

class AcademicWorkspaceProvider extends ChangeNotifier {
  final AcademicWorkspaceService _service = AcademicWorkspaceService();

  final Map<String, List<ProjectStage>> stagesByProject = {};
  final Map<String, List<DeliveryItem>> deliveriesByProject = {};
  final Map<String, List<AcademicEvaluation>> evaluationsByProject = {};
  final Map<String, List<DeliveryVersion>> versionsByDelivery = {};
  final List<AdviseeSummary> advisees = [];
  final List<Subscription> advisorApplications = [];
  final List<AcademicDocument> documents = [];
  final List<AcademicDocument> profileDocuments = [];
  final List<Project> profileProjects = [];

  AdvisorDashboard? advisorSummary;
  AdviseeDetail? selectedAdvisee;
  User? selectedUser;
  bool isLoading = false;
  String? errorMessage;
  int _pendingOperations = 0;

  List<ProjectStage> stagesFor(String projectId) =>
      stagesByProject[projectId] ?? const [];
  List<DeliveryItem> deliveriesFor(String projectId) =>
      deliveriesByProject[projectId] ?? const [];
  List<AcademicEvaluation> evaluationsFor(String projectId) =>
      evaluationsByProject[projectId] ?? const [];

  Future<void> loadStages(String projectId) => _run(() async {
        stagesByProject[projectId] = await _service.stages(projectId);
      });

  Future<void> loadDeliveries(String projectId) => _run(() async {
        deliveriesByProject[projectId] = await _service.deliveries(projectId);
      });

  Future<void> loadEvaluations(String projectId) => _run(() async {
        evaluationsByProject[projectId] = await _service.evaluations(projectId);
      });

  /// Cada lista e resolvida por conta propria. Da para chegar aqui com um
  /// projeto que se pode ver mas do qual nao se participa -- o detalhe do
  /// projeto leva para `/evaluations?projectId=X` e `/deliveries?projectId=X`
  /// sem exigir vinculo -- e nesse caso o backend responde 403 nas tres. Num
  /// Future.wait sem protecao, isso virava "Voce nao tem permissao para esta
  /// acao" no lugar do conteudo, e o aviso ficava no provider, que e
  /// compartilhado, aparecendo depois em outras telas.
  Future<void> loadProjectWorkspace(String projectId) => _run(() async {
        final results = await Future.wait<dynamic>([
          _forbiddenAsEmpty(_service.stages(projectId), const <ProjectStage>[]),
          _forbiddenAsEmpty(
              _service.deliveries(projectId), const <DeliveryItem>[]),
          _forbiddenAsEmpty(
              _service.evaluations(projectId), const <AcademicEvaluation>[]),
        ]);
        stagesByProject[projectId] = results[0] as List<ProjectStage>;
        deliveriesByProject[projectId] = results[1] as List<DeliveryItem>;
        evaluationsByProject[projectId] =
            results[2] as List<AcademicEvaluation>;
      });

  /// 403 quer dizer "isto nao e seu para ver", nao "algo deu errado": devolve
  /// vazio e deixa a tela mostrar seu estado vazio normal. Os demais erros
  /// seguem subindo para virar aviso.
  Future<List<T>> _forbiddenAsEmpty<T>(
    Future<List<T>> request,
    List<T> fallback,
  ) async {
    try {
      return await request;
    } on DioException catch (error) {
      if (error.response?.statusCode == 403) return fallback;
      rethrow;
    }
  }

  /// meusProjetos=true traz tambem projetos em que o usuario apenas se
  /// inscreveu, e para esses o backend responde 403 em /etapas ("Sem permissao
  /// para consultar a equipe deste projeto"). Com Future.wait sem protecao, um
  /// unico 403 derrubava a agenda inteira e a tela virava "Voce nao tem
  /// permissao para esta acao", escondendo os prazos que o usuario pode ver.
  ///
  /// Cada projeto agora e resolvido isoladamente: o que nao pode ser lido e
  /// omitido, e os demais aparecem.
  Future<void> loadAgenda(List<Project> projects) => _run(() async {
        final collections = await Future.wait(
          projects.map((project) async {
            try {
              final stages = await _service.stages(project.id);
              return MapEntry(
                project.id,
                stages.map((stage) => stage.withProject(project)).toList(),
              );
            } on DioException {
              return MapEntry(project.id, const <ProjectStage>[]);
            }
          }),
        );
        stagesByProject.addEntries(collections);
      });

  /// Mesma protecao de [loadAgenda]: /entregas responde 403 nos projetos em
  /// que o usuario nao participa ("Sem permissao para acessar as entregas
  /// deste projeto"), e um so deles nao pode zerar a lista toda.
  Future<void> loadDeliveriesForProjects(List<Project> projects) =>
      _run(() async {
        final collections = await Future.wait(
          projects.map((project) async {
            try {
              final items = await _service.deliveries(project.id);
              return MapEntry(
                project.id,
                items.map((item) => item.withProject(project)).toList(),
              );
            } on DioException {
              return MapEntry(project.id, const <DeliveryItem>[]);
            }
          }),
        );
        deliveriesByProject.addEntries(collections);
      });

  /// Mesma protecao de [loadAgenda]: /avaliacoes responde 403 nos projetos em
  /// que o usuario nao participa ("Sem permissao para visualizar as avaliacoes
  /// deste projeto").
  Future<void> loadEvaluationsForProjects(List<Project> projects) =>
      _run(() async {
        final collections = await Future.wait(
          projects.map((project) async {
            try {
              final items = await _service.evaluations(project.id);
              return MapEntry(
                project.id,
                items.map((item) => item.withProject(project)).toList(),
              );
            } on DioException {
              return MapEntry(project.id, const <AcademicEvaluation>[]);
            }
          }),
        );
        evaluationsByProject.addEntries(collections);
      });

  Future<bool> completeStage(String projectId, String stageId) =>
      _action(() async {
        await _service.completeStage(projectId, stageId);
        stagesByProject[projectId] = await _service.stages(projectId);
      });

  Future<bool> saveStage(
    String projectId,
    Map<String, dynamic> data, {
    String? stageId,
  }) =>
      _action(() async {
        await _service.saveStage(projectId, data, stageId: stageId);
        stagesByProject[projectId] = await _service.stages(projectId);
      });

  Future<bool> deleteStage(String projectId, String stageId) =>
      _action(() async {
        await _service.deleteStage(projectId, stageId);
        stagesByProject[projectId] = await _service.stages(projectId);
      });

  Future<bool> createDelivery({
    required String projectId,
    required String title,
    required String category,
    required PlatformFile file,
    String? stageId,
  }) =>
      _action(() async {
        await _service.createDelivery(
          projectId: projectId,
          title: title,
          category: category,
          file: file,
          stageId: stageId,
        );
        deliveriesByProject[projectId] = await _service.deliveries(projectId);
      });

  Future<void> loadVersions(String projectId, String deliveryId) =>
      _run(() async {
        versionsByDelivery[deliveryId] =
            await _service.deliveryVersions(projectId, deliveryId);
      });

  Future<Uri?> deliveryDownloadUrl(
    String projectId,
    String deliveryId,
    String versionId,
  ) async {
    _beginOperation();
    errorMessage = null;
    try {
      return await _service.deliveryDownloadUrl(
        projectId,
        deliveryId,
        versionId,
      );
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Não foi possível abrir o arquivo da entrega.';
      return null;
    } finally {
      _endOperation();
    }
  }

  Future<bool> resubmitDelivery(
    String projectId,
    String deliveryId,
    PlatformFile file,
  ) =>
      _action(() async {
        await _service.resubmitDelivery(
          projectId: projectId,
          deliveryId: deliveryId,
          file: file,
        );
        deliveriesByProject[projectId] = await _service.deliveries(projectId);
      });

  Future<bool> reviewDelivery({
    required String projectId,
    required String deliveryId,
    required String versionId,
    required String decision,
    String? comment,
  }) =>
      _action(() async {
        await _service.reviewDelivery(
          projectId: projectId,
          deliveryId: deliveryId,
          versionId: versionId,
          decision: decision,
          comment: comment,
        );
        deliveriesByProject[projectId] = await _service.deliveries(projectId);
        versionsByDelivery[deliveryId] =
            await _service.deliveryVersions(projectId, deliveryId);
      });

  Future<bool> saveEvaluation(
    String projectId,
    Map<String, dynamic> data, {
    String? evaluationId,
  }) =>
      _action(() async {
        await _service.saveEvaluation(
          projectId: projectId,
          data: data,
          evaluationId: evaluationId,
        );
        evaluationsByProject[projectId] = await _service.evaluations(projectId);
      });

  Future<bool> acknowledgeEvaluation(
    String projectId,
    String evaluationId,
    String? comment,
  ) =>
      _action(() async {
        await _service.acknowledgeEvaluation(
          projectId,
          evaluationId,
          comment,
        );
        evaluationsByProject[projectId] = await _service.evaluations(projectId);
      });

  Future<void> loadAdvisorDashboard() => _run(() async {
        advisorSummary = await _service.advisorDashboard();
      });

  Future<void> loadAdvisorApplications({
    String? status,
    String? projectId,
  }) =>
      _run(() async {
        advisorApplications
          ..clear()
          ..addAll(await _service.advisorApplications(
            status: status,
            projectId: projectId,
          ));
      });

  Future<void> loadProjectApplications(String projectId) => _run(() async {
        advisorApplications
          ..clear()
          ..addAll(await _service.projectApplications(projectId));
      });

  Future<void> loadAdvisees({
    String? search,
    String? projectId,
    String? situation,
  }) =>
      _run(() async {
        advisees
          ..clear()
          ..addAll(await _service.advisees(
            search: search,
            projectId: projectId,
            situation: situation,
          ));
      });

  Future<void> loadAdvisee(String studentId, {String? projectId}) {
    selectedAdvisee = null;
    return _run(() async {
      selectedAdvisee = await _service.advisee(studentId, projectId: projectId);
    });
  }

  Future<void> loadDocuments(String userId) => _run(() async {
        documents
          ..clear()
          ..addAll(await _service.documents(userId));
      });

  Future<bool> deleteDocument(String id, String userId) => _action(() async {
        await _service.deleteDocument(id);
        documents
          ..clear()
          ..addAll(await _service.documents(userId));
      });

  Future<void> loadUserProfile(String userId) {
    selectedUser = null;
    profileProjects.clear();
    profileDocuments.clear();
    return _run(() async {
      final results = await Future.wait<dynamic>([
        _service.userProfile(userId),
        _service.userProjects(userId),
        _service.documents(userId),
      ]);
      selectedUser = results[0] as User;
      profileProjects
        ..clear()
        ..addAll(results[1] as List<Project>);
      profileDocuments
        ..clear()
        ..addAll(results[2] as List<AcademicDocument>);
    });
  }

  Future<void> _run(Future<void> Function() operation) async {
    _beginOperation();
    errorMessage = null;
    try {
      await operation();
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar os dados academicos.';
    } finally {
      _endOperation();
    }
  }

  Future<bool> _action(Future<void> Function() operation) async {
    _beginOperation();
    errorMessage = null;
    try {
      await operation();
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Nao foi possivel concluir esta acao.';
      return false;
    } finally {
      _endOperation();
    }
  }

  void _beginOperation() {
    _pendingOperations += 1;
    isLoading = true;
    notifyListeners();
  }

  void _endOperation() {
    if (_pendingOperations > 0) _pendingOperations -= 1;
    isLoading = _pendingOperations > 0;
    notifyListeners();
  }
}
