import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/project.dart';
import '../models/user.dart';
import '../services/project_service.dart';

enum ProjectListMode { explore, mine }

class ProjectProvider extends ChangeNotifier {
  final ProjectService _service = ProjectService();

  static const pageSize = 10;

  final List<Project> projects = <Project>[];
  final List<ProjectOption> areas = <ProjectOption>[];
  final List<ProjectOption> advisors = <ProjectOption>[];
  final Map<String, Project> _projectCache = <String, Project>{};
  final Map<String, List<User>> _collaboratorsByProject = {};

  ProjectListMode listMode = ProjectListMode.explore;
  bool isListLoading = false;
  bool isLoadingMore = false;
  bool isDetailLoading = false;
  bool isLoading = false;
  bool isFormLoading = false;
  String? errorMessage;
  int currentPage = 0;
  int totalPages = 0;
  int totalProjects = 0;
  bool isLastPage = true;

  String? _search;
  String? _status;
  String? _area;
  String? _course;

  bool get canLoadMore => !isLastPage && !isListLoading && !isLoadingMore;
  bool get isActionLoading => isLoading;

  List<User> collaboratorsFor(String projectId) =>
      List.unmodifiable(_collaboratorsByProject[projectId] ?? const []);

  Future<void> setListMode(ProjectListMode mode) async {
    if (listMode == mode && projects.isNotEmpty) return;
    listMode = mode;
    notifyListeners();
    await loadProjects(
      search: _search,
      status: _status,
      area: _area,
      course: _course,
    );
  }

  Future<void> loadProjects({
    String? search,
    String? status,
    String? area,
    String? course,
  }) async {
    _search = _clean(search);
    _status = _clean(status);
    _area = _clean(area);
    _course = _clean(course);
    isListLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final result = await _service.listPage(
        search: _search,
        status: _status,
        area: _area,
        course: _course,
        mine: listMode == ProjectListMode.mine,
        page: 0,
        size: pageSize,
      );
      projects
        ..clear()
        ..addAll(result.items);
      _storePage(result);
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar os projetos.';
    } finally {
      isListLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreProjects() async {
    if (!canLoadMore) return;
    isLoadingMore = true;
    errorMessage = null;
    notifyListeners();
    try {
      final result = await _service.listPage(
        search: _search,
        status: _status,
        area: _area,
        course: _course,
        mine: listMode == ProjectListMode.mine,
        page: currentPage + 1,
        size: pageSize,
      );
      final knownIds = projects.map((project) => project.id).toSet();
      projects.addAll(
        result.items.where((project) => knownIds.add(project.id)),
      );
      _storePage(result);
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar mais projetos.';
    } finally {
      isLoadingMore = false;
      notifyListeners();
    }
  }

  Future<Project?> loadProject(String id, {bool forceRefresh = false}) async {
    if (!forceRefresh && _projectCache.containsKey(id)) {
      return _projectCache[id];
    }
    isDetailLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.getById(id);
      _storeProject(project);
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Não foi possível carregar o projeto.';
      return null;
    } finally {
      isDetailLoading = false;
      notifyListeners();
    }
  }

  Project? findProject(String id) => _projectCache[id];

  Future<void> loadCollaborators(String projectId) async {
    errorMessage = null;
    notifyListeners();
    try {
      _collaboratorsByProject[projectId] =
          await _service.listCollaborators(projectId);
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar a equipe do projeto.';
    } finally {
      notifyListeners();
    }
  }

  Future<void> loadFormOptions({required bool includeAdvisors}) async {
    isFormLoading = true;
    errorMessage = null;
    areas.clear();
    advisors.clear();
    notifyListeners();
    try {
      final loadedAreas = await _service.listAreas();
      areas.addAll(loadedAreas.where((option) => option.id > 0));
      if (includeAdvisors) {
        final loadedAdvisors = await _service.listAdvisors();
        advisors.addAll(loadedAdvisors.where((option) => option.id > 0));
      }
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar as opções do projeto.';
    } finally {
      isFormLoading = false;
      notifyListeners();
    }
  }

  Future<Project?> createProject(Map<String, dynamic> data) async {
    if (isLoading) return null;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.create(data);
      _projectCache[project.id] = project;
      projects.removeWhere((item) => item.id == project.id);
      projects.insert(0, project);
      totalProjects += 1;
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Não foi possível salvar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Project?> updateProject(String id, Map<String, dynamic> data) async {
    if (isLoading) return null;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.update(id, data);
      _storeProject(project);
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Não foi possível atualizar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> acceptOrientation(String projectId) =>
      _updateOrientation(projectId, accept: true);

  Future<bool> rejectOrientation(String projectId) =>
      _updateOrientation(projectId, accept: false);

  Future<bool> _updateOrientation(
    String projectId, {
    required bool accept,
  }) async {
    if (isLoading) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = accept
          ? await _service.acceptOrientation(projectId)
          : await _service.rejectOrientation(projectId);
      _storeProject(project);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível analisar a orientação.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateStatus(String projectId, String status) async {
    if (isLoading) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      _storeProject(await _service.updateStatus(projectId, status));
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível alterar o status do projeto.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteProject(String projectId) async {
    if (isLoading) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.delete(projectId);
      projects.removeWhere((project) => project.id == projectId);
      _projectCache.remove(projectId);
      _collaboratorsByProject.remove(projectId);
      if (totalProjects > 0) totalProjects -= 1;
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível excluir o projeto.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> removeCollaborator(
    String projectId,
    String userId,
  ) async {
    if (isLoading) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.removeCollaborator(projectId, userId);
      _collaboratorsByProject[projectId]
          ?.removeWhere((user) => user.id == userId);
      final refreshed = await _service.getById(projectId);
      _storeProject(refreshed);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível remover o colaborador.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    if (errorMessage == null) return;
    errorMessage = null;
    notifyListeners();
  }

  void _storePage(ProjectPage result) {
    currentPage = result.page;
    totalPages = result.totalPages;
    totalProjects = result.totalElements;
    isLastPage = result.isLast;
    for (final project in result.items) {
      _projectCache[project.id] = project;
    }
  }

  void _storeProject(Project project) {
    _projectCache[project.id] = project;
    final index = projects.indexWhere((item) => item.id == project.id);
    if (index >= 0) projects[index] = project;
  }

  static String? _clean(String? value) {
    final text = value?.trim() ?? '';
    return text.isEmpty ? null : text;
  }
}
