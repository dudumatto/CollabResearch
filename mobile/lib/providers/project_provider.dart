import 'package:flutter/foundation.dart';

import '../models/project.dart';
import '../services/project_service.dart';
import '../services/subscription_service.dart';

class ProjectProvider extends ChangeNotifier {
  final ProjectService _service = ProjectService();
  final SubscriptionService _subscriptionService = SubscriptionService();
  final List<Project> projects = <Project>[];
  final Map<String, Project> _projectCache = <String, Project>{};
  bool isLoading = false;
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
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar o projeto.';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Project? findProject(String id) => _projectCache[id];

  Future<Project?> createProject(Map<String, dynamic> data) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final project = await _service.create(data);
      projects.insert(0, project);
      _projectCache[project.id] = project;
      return project;
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
    } catch (_) {
      errorMessage = 'Nao foi possivel realizar a inscricao.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
