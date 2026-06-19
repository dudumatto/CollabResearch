import '../core/api/api_client.dart';

abstract class BaseService {
  BaseService() : apiClient = ApiClient.instance;

  final ApiClient apiClient;
}

