import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/subscription.dart';
import '../services/lumen_service.dart';
import '../services/subscription_service.dart';

class SubscriptionProvider extends ChangeNotifier {
  final SubscriptionService _service = SubscriptionService();
  final LumenService _lumen = LumenService();

  final List<Subscription> subscriptions = <Subscription>[];
  final Map<String, List<Subscription>> _projectSubscriptions = {};
  bool isLoading = false;
  bool isActionLoading = false;
  bool isRanking = false;
  String? lumenNotice;
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

  /// Orientador: inscricoes de todos os seus projetos.
  Future<void> loadForAdvisor() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      subscriptions
        ..clear()
        ..addAll(await _service.listForAdvisor());
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível carregar as inscrições.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Lumen AI: avalia as inscricoes pendentes de [projectId] (ou apenas [ids])
  /// e guarda nota e justificativa nas inscricoes carregadas.
  Future<bool> rank(String projectId, {List<String> ids = const []}) async {
    if (isRanking) return false;
    isRanking = true;
    errorMessage = null;
    lumenNotice = null;
    notifyListeners();
    try {
      final ranking = await _lumen.rank(projectId, ids: ids);
      for (final candidate in ranking) {
        final index =
            subscriptions.indexWhere((s) => s.id == candidate.subscriptionId);
        if (index < 0) continue;
        subscriptions[index] = subscriptions[index].withLumen(
          score: candidate.score,
          justification: candidate.justification,
          evaluation: candidate.evaluation,
        );
      }
      return true;
    } on LumenEmptyRanking catch (empty) {
      lumenNotice = empty.notice ?? 'A Lumen não retornou sugestões.';
      return false;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Não foi possível analisar com a Lumen.';
      return false;
    } finally {
      isRanking = false;
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

  Future<bool> review(
    String id, {
    required bool approve,
    String? opinion,
  }) async {
    if (isActionLoading) return false;
    isActionLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final updated =
          approve
              ? await _service.approve(id, opinion: opinion)
              : await _service.reject(id, opinion: opinion);
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
      final old = subscriptions[index];
      // A resposta de aprovar/rejeitar pode vir sem a nota da Lumen.
      subscriptions[index] =
          subscription.lumenScore == null && old.lumenScore != null
              ? subscription.withLumen(
                  score: old.lumenScore!,
                  justification: old.lumenJustification,
                  evaluation: old.lumenEvaluation,
                )
              : subscription;
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
