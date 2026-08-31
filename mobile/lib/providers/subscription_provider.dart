import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/subscription.dart';
import '../services/subscription_service.dart';

class SubscriptionProvider extends ChangeNotifier {
  final SubscriptionService _service = SubscriptionService();

  final List<Subscription> subscriptions = <Subscription>[];
  final Map<String, List<Subscription>> _projectSubscriptions = {};
  bool isLoading = false;
  bool isActionLoading = false;
  String? errorMessage;

  List<Subscription> forProject(String projectId) =>
      List.unmodifiable(_projectSubscriptions[projectId] ?? const []);

  Subscription? currentForProject(String projectId) {
    for (final subscription in subscriptions) {
      if (subscription.projectId == projectId) return subscription;
    }
    return null;
  }

  Future<void> load() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      subscriptions
        ..clear()
        ..addAll(await _service.list());
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar as inscricoes.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadForProject(String projectId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      _projectSubscriptions[projectId] =
          await _service.listByProject(projectId);
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar as inscrições do projeto.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> subscribe(
    String projectId, {
    String? motivation,
  }) async {
    if (isActionLoading) return false;
    isActionLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final created = await _service.create(
        projectId,
        motivation: motivation,
      );
      _upsert(created);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível realizar a inscrição.';
      return false;
    } finally {
      isActionLoading = false;
      notifyListeners();
    }
  }

  Future<bool> review(String id, {required bool approve}) async {
    if (isActionLoading) return false;
    isActionLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final updated =
          approve ? await _service.approve(id) : await _service.reject(id);
      _upsert(updated);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível analisar a inscrição.';
      return false;
    } finally {
      isActionLoading = false;
      notifyListeners();
    }
  }

  Future<bool> cancel(String id) async {
    if (isActionLoading) return false;
    isActionLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.cancel(id);
      subscriptions.removeWhere((item) => item.id == id);
      for (final items in _projectSubscriptions.values) {
        items.removeWhere((item) => item.id == id);
      }
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível cancelar a inscrição.';
      return false;
    } finally {
      isActionLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    subscriptions.clear();
    _projectSubscriptions.clear();
    errorMessage = null;
    isLoading = false;
    isActionLoading = false;
    notifyListeners();
  }

  void _upsert(Subscription subscription) {
    final index =
        subscriptions.indexWhere((item) => item.id == subscription.id);
    if (index >= 0) {
      subscriptions[index] = subscription;
    } else {
      subscriptions.insert(0, subscription);
    }

    final projectItems = _projectSubscriptions[subscription.projectId];
    if (projectItems == null) return;
    final projectIndex =
        projectItems.indexWhere((item) => item.id == subscription.id);
    if (projectIndex >= 0) {
      projectItems[projectIndex] = subscription;
    } else {
      projectItems.insert(0, subscription);
    }
  }
}
