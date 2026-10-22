import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/lumen_recommendation.dart';
import '../services/lumen_service.dart';

class LumenProvider extends ChangeNotifier {
  final LumenService _service = LumenService();

  LumenResult result = const LumenResult();
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadLatest() => _run(_service.latest);

  Future<void> analyze() => _run(_service.analyze);

  Future<void> _run(Future<LumenResult> Function() call) async {
    if (isLoading) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      result = await call();
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Não foi possível obter as recomendações.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
