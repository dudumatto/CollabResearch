import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../models/dashboard_summary.dart';
import '../services/dashboard_service.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardService _service = DashboardService();

  DashboardSummary? summary;
  bool isLoading = false;
  String? errorMessage;

  Future<void> load() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      summary = await _service.load();
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar o dashboard.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    summary = null;
    errorMessage = null;
    isLoading = false;
    notifyListeners();
  }
}
