import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/subscription.dart';
import '../services/subscription_service.dart';

class SubscriptionProvider extends ChangeNotifier {
  final SubscriptionService _service = SubscriptionService();

  final List<Subscription> subscriptions = <Subscription>[];
  bool isLoading = false;
  String? errorMessage;

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

  Future<bool> review(String id, {required bool approve}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final updated =
          approve ? await _service.approve(id) : await _service.reject(id);
      final index = subscriptions.indexWhere((item) => item.id == id);
      if (index >= 0) subscriptions[index] = updated;
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Nao foi possivel analisar a inscricao.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> cancel(String id) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.cancel(id);
      subscriptions.removeWhere((item) => item.id == id);
      return true;
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
      return false;
    } catch (_) {
      errorMessage = 'Nao foi possivel cancelar a inscricao.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    subscriptions.clear();
    errorMessage = null;
    isLoading = false;
    notifyListeners();
  }
}
