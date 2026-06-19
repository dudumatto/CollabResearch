import 'package:dio/dio.dart';

import '../api/api_client.dart';
import '../api/api_endpoints.dart';

class AuthService {
  AuthService(this._apiClient);

  final ApiClient _apiClient;

  Future<Response<dynamic>> login(Map<String, dynamic> body) {
    return _apiClient.dio.post(ApiEndpoints.login, data: body);
  }

  Future<Response<dynamic>> register(Map<String, dynamic> body) {
    return _apiClient.dio.post(ApiEndpoints.register, data: body);
  }

  Future<Response<dynamic>> logout() {
    return _apiClient.dio.post(ApiEndpoints.logout);
  }

  Future<Response<dynamic>> me() {
    return _apiClient.dio.get(ApiEndpoints.me);
  }

  Future<Response<dynamic>> changePassword(Map<String, dynamic> body) {
    return _apiClient.dio.put(ApiEndpoints.changePassword, data: body);
  }

  Future<Response<dynamic>> updateProfile(
      String id, Map<String, dynamic> body) {
    return _apiClient.dio.put(ApiEndpoints.user(id), data: body);
  }

  Future<Response<dynamic>> updatePreferences(Map<String, dynamic> body) {
    return _apiClient.dio.put(ApiEndpoints.userPreferences(), data: body);
  }
}
