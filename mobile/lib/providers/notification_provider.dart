import 'package:flutter/foundation.dart';

import '../models/app_notification.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();
  final List<AppNotification> notifications = <AppNotification>[];
  int unreadCount = 0;
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadNotifications() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedNotifications = await _service.list();
      notifications
        ..clear()
        ..addAll(loadedNotifications);
      _refreshUnreadCount();
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar as notificacoes.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.markAllAsRead();
      await loadNotifications();
    } catch (_) {
      errorMessage = 'Nao foi possivel marcar as notificacoes como lidas.';
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> markAsRead(String id) async {
    if (id.isEmpty) return false;
    errorMessage = null;
    notifyListeners();
    try {
      final updatedNotification = await _service.markAsRead(id);
      final index =
          notifications.indexWhere((notification) => notification.id == id);
      if (index != -1) {
        notifications[index] = updatedNotification;
      }
      _refreshUnreadCount();
      notifyListeners();
      return true;
    } catch (_) {
      errorMessage = 'Nao foi possivel marcar a notificacao como lida.';
      notifyListeners();
      return false;
    }
  }

  void markLocallyAsRead(String id) {
    final index =
        notifications.indexWhere((notification) => notification.id == id);
    if (index == -1 || notifications[index].isRead) return;
    notifications[index] = notifications[index].copyWith(isRead: true);
    _refreshUnreadCount();
    notifyListeners();
  }

  void _refreshUnreadCount() {
    unreadCount =
        notifications.where((notification) => !notification.isRead).length;
  }
}
