import 'package:flutter/foundation.dart';

import '../models/app_notification.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  /// [service] e injetavel para teste; em producao continua sendo o servico
  /// real, criado aqui mesmo.
  NotificationProvider({NotificationService? service})
      : _service = service ?? NotificationService();

  final NotificationService _service;
  final List<AppNotification> notifications = <AppNotification>[];
  int unreadCount = 0;
  bool isLoading = false;

  /// Ocupado apenas em "marcar todas". Separado de [isLoading] para a acao nao
  /// bloquear a tela inteira: quem sinaliza ocupado e o proprio botao.
  bool isMarkingAll = false;

  /// Erro de **carga**. So este pode virar tela cheia de erro.
  String? errorMessage;

  /// Erro de **acao** (marcar como lida). Sai como snackbar, sem substituir a
  /// lista que o usuario esta lendo.
  String? actionErrorMessage;

  Future<void> loadNotifications() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedNotifications = await _service.list();
      notifications
        ..clear()
        ..addAll(loadedNotifications)
        // A ordem vinha 100% confiada no servidor, e o agrupamento por dia so
        // e correto sobre lista ordenada.
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _refreshUnreadCount();
    } catch (_) {
      errorMessage = 'Não foi possível carregar as notificações.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    if (isMarkingAll) return;
    isMarkingAll = true;
    actionErrorMessage = null;
    notifyListeners();
    try {
      await _service.markAllAsRead();
      await loadNotifications();
    } catch (_) {
      actionErrorMessage =
          'Não foi possível marcar as notificações como lidas.';
    } finally {
      isMarkingAll = false;
      notifyListeners();
    }
  }

  Future<bool> markAsRead(String id) async {
    if (id.isEmpty) return false;
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
      actionErrorMessage = 'Não foi possível marcar a notificação como lida.';
      notifyListeners();
      return false;
    }
  }

  /// Devolve o erro de acao pendente e o limpa, para a tela mostrar o snackbar
  /// uma vez so.
  String? consumeActionError() {
    final message = actionErrorMessage;
    actionErrorMessage = null;
    return message;
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
