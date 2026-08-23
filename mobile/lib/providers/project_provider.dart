import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../models/project.dart';
import '../services/project_service.dart';
import '../services/subscription_service.dart';

class ProjectProvider extends ChangeNotifier {
  final ProjectService _service = ProjectService();
  final SubscriptionService _subscriptionService = SubscriptionService();
  final List<Project> projects = <Project>[];
  final List<ProjectOption> areas = <ProjectOption>[];
  final List<ProjectOption> advisors = <ProjectOption>[];
  final Map<String, Project> _projectCache = <String, Project>{};
  bool isLoading = false;
  bool isFormLoading = false;
  String? errorMessage;

  Future<void> loadProjects({
    String? search,
    String? status,
    String? area,
    String? course,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedProjects = await _service.list(
        search: search,
        status: status,
        area: area,
        course: course,
      );
      projects
        ..clear()
        ..addAll(loadedProjects);
      for (final project in loadedProjects) {
        _projectCache[project.id] = project;
      }
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar os projetos.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Project?> loadProject(String id) async {
    if (_projectCache.containsKey(id)) return _projectCache[id];
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.getById(id);
      _projectCache[id] = project;
      final index = projects.indexWhere((item) => item.id == project.id);
      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.add(project);
      }
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Project? findProject(String id) => _projectCache[id];

  Future<void> loadFormOptions({required bool includeAdvisors}) async {
    isFormLoading = true;
    errorMessage = null;
    areas.clear();
    advisors.clear();
    notifyListeners();
    try {
      final loadedAreas = await _service.listAreas();
      areas
        ..clear()
        ..addAll(loadedAreas.where((option) => option.id > 0));
      if (includeAdvisors) {
        final loadedAdvisors = await _service.listAdvisors();
        advisors
          ..clear()
          ..addAll(loadedAdvisors.where((option) => option.id > 0));
      }
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar as opcoes do projeto.';
    } finally {
      isFormLoading = false;
      notifyListeners();
    }
  }

  Future<Project?> createProject(Map<String, dynamic> data) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.create(data);
      projects.insert(0, project);
      _projectCache[project.id] = project;
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Nao foi possivel salvar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Project?> updateProject(String id, Map<String, dynamic> data) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.update(id, data);
      _projectCache[project.id] = project;
      final index = projects.indexWhere((item) => item.id == project.id);
      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.add(project);
      }
      return project;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return null;
    } catch (_) {
      errorMessage = 'Nao foi possivel atualizar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> subscribeToProject(String projectId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _subscriptionService.create(projectId);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Nao foi possivel realizar a inscricao.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> acceptOrientation(String projectId) async {
    return _updateOrientation(projectId, accept: true);
  }

  Future<bool> rejectOrientation(String projectId) async {
    return _updateOrientation(projectId, accept: false);
  }

  Future<bool> _updateOrientation(
    String projectId, {
    required bool accept,
  }) async {
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
      errorMessage = 'Nao foi possivel analisar a orientacao.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void _storeProject(Project project) {
    _projectCache[project.id] = project;
    final index = projects.indexWhere((item) => item.id == project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.add(project);
    }
  }
}
