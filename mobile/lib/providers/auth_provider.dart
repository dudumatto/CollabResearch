import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/auth/jwt_decoder.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() : _repository = AuthRepository() {
    _apiClient = ApiClient.instance;
  }

  late final ApiClient _apiClient;
  final AuthRepository _repository;

  User? currentUser;
  String? token;
  bool isLoading = false;
  String? pendingRedirectLocation;

  bool get isAuthenticated => token != null && token!.isNotEmpty;

  Future<void> login(String email, String password) async {
    isLoading = true;
    notifyListeners();
    try {
      final response = await _repository.login(email, password);
      token = _extractToken(response.data);
      if (token != null && token!.isNotEmpty) {
        await _apiClient.saveToken(token!);
        currentUser = _extractUser(response.data) ?? _userFromToken(token!);
      }
    } on FormatException {
      await _apiClient.clearToken();
      token = null;
      currentUser = null;
      rethrow;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(Map<String, dynamic> data) async {
    isLoading = true;
    notifyListeners();
    try {
      await _repository.register(data);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {}
    await _apiClient.clearToken();
    token = null;
    currentUser = null;
    pendingRedirectLocation = null;
    notifyListeners();
  }

  Future<void> checkAuth() async {
    final saved = await _apiClient.readToken();
    if (saved == null || saved.isEmpty || JwtDecoder.isExpired(saved)) {
      await _apiClient.clearToken();
      token = null;
      currentUser = null;
      notifyListeners();
      return;
    }
    try {
      token = saved;
      currentUser = _userFromToken(saved);
      await refreshProfile();
    } on FormatException {
      await _apiClient.clearToken();
      token = null;
      currentUser = null;
    }
    notifyListeners();
  }

  Future<bool> refreshProfile() async {
    try {
      final response = await _repository.me();
      currentUser = _extractUser({'usuario': response.data}) ??
          User.fromJson(_asStringKeyMap(response.data));
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    final userId = currentUser?.id;
    if (userId == null || userId.isEmpty) return false;
    isLoading = true;
    notifyListeners();
    try {
      await _repository.updateProfile(userId, data);
      await refreshProfile();
      return true;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updatePreferences({
    required bool notificationsEnabled,
    required String theme,
  }) async {
    isLoading = true;
    notifyListeners();
    try {
      final response = await _repository.updatePreferences(
        notificationsEnabled: notificationsEnabled,
        theme: theme,
      );
      currentUser = User.fromJson(_asStringKeyMap(response.data));
      notifyListeners();
      return true;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> changePassword(
      String currentPassword, String newPassword) async {
    isLoading = true;
    notifyListeners();
    try {
      await _repository.changePassword(currentPassword, newPassword);
      return true;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void setPendingRedirect(String location) {
    pendingRedirectLocation = location;
    notifyListeners();
  }

  void clearPendingRedirect() {
    pendingRedirectLocation = null;
  }

  User _userFromToken(String tokenValue) {
    final payload = JwtDecoder.decodePayload(tokenValue);
    return User.fromJwtPayload(payload);
  }

  String _extractToken(dynamic responseData) {
    if (responseData is String) {
      return responseData;
    }
    if (responseData is Map<String, dynamic>) {
      final value = responseData['token'] ?? responseData['accessToken'];
      return value == null ? '' : '$value';
    }
    return '';
  }

  User? _extractUser(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final value = responseData['usuario'] ?? responseData['user'];
      if (value is Map<String, dynamic>) {
        return User.fromJson(value);
      }
      if (value is Map) {
        return User.fromJson(
            value.map((key, value) => MapEntry('$key', value)));
      }
    }
    return null;
  }

  Map<String, dynamic> _asStringKeyMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, value) => MapEntry('$key', value));
    }
    return <String, dynamic>{};
  }
}
