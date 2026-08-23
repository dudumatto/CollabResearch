import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/feedback_entry.dart';
import '../models/progress_entry.dart';
import '../models/project.dart';
import '../services/research_activity_service.dart';

class ResearchActivityProvider extends ChangeNotifier {
  final ResearchActivityService _service = ResearchActivityService();

  final List<Project> relatedProjects = <Project>[];
  final List<ProgressEntry> progressEntries = <ProgressEntry>[];
  final List<FeedbackEntry> feedbackEntries = <FeedbackEntry>[];
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadRelatedProjects() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      relatedProjects
        ..clear()
        ..addAll(await _service.listRelatedProjects());
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar seus projetos.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadProgress(String projectId) async {
    await _loadList(
      () async {
        final loaded = await _service.listProgress(projectId);
        progressEntries
          ..clear()
          ..addAll(loaded);
      },
      fallback: 'Nao foi possivel carregar o progresso.',
    );
  }

  Future<bool> createProgress(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    return _create(
      () async {
        final entry = await _service.createProgress(projectId, data);
        progressEntries.insert(0, entry);
      },
      fallback: 'Nao foi possivel registrar o progresso.',
    );
  }

  Future<void> loadFeedback(String projectId) async {
    await _loadList(
      () async {
        final loaded = await _service.listFeedback(projectId);
        feedbackEntries
          ..clear()
          ..addAll(loaded);
      },
      fallback: 'Nao foi possivel carregar os feedbacks.',
    );
  }

  Future<bool> createFeedback(Map<String, dynamic> data) async {
    return _create(
      () async {
        final entry = await _service.createFeedback(data);
        feedbackEntries.insert(0, entry);
      },
      fallback: 'Nao foi possivel registrar o feedback.',
    );
  }

  Future<void> _loadList(
    Future<void> Function() operation, {
    required String fallback,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await operation();
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = fallback;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> _create(
    Future<void> Function() operation, {
    required String fallback,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await operation();
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = fallback;
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    relatedProjects.clear();
    progressEntries.clear();
    feedbackEntries.clear();
    errorMessage = null;
    isLoading = false;
    notifyListeners();
  }
}
