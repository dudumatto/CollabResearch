import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/app_notification.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/notifications/notification_tile.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  Future<void> _openNotification(AppNotification notification) async {
    final provider = context.read<NotificationProvider>();
    if (!notification.isRead) {
      final marked = await provider.markAsRead(notification.id);
      if (!marked) {
        _showSnackBar('Nao foi possivel marcar a notificacao como lida.');
        return;
      }
    }

    final chatRoute = _chatRoute(notification);
    if (chatRoute != null) {
      if (mounted) context.go(chatRoute);
      return;
    }

    final actionRoute = _internalRouteFrom(notification.actionUrl);
    if (actionRoute != null && actionRoute != '/notifications') {
      if (mounted) context.go(actionRoute);
      return;
    }

    if (notification.type.toUpperCase() == 'MENSAGEM_RECEBIDA') {
      _showSnackBar(
          'Nao foi possivel identificar a conversa dessa notificacao.');
    }
  }

  String? _chatRoute(AppNotification notification) {
    final conversationId = notification.conversationId;
    if (conversationId == null || conversationId.isEmpty) return null;

    final uri = Uri(
      path: '/chat/$conversationId',
      queryParameters: notification.messageId == null
          ? null
          : <String, String>{'messageId': notification.messageId!},
    );
    return uri.toString();
  }

  String? _internalRouteFrom(String? actionUrl) {
    if (actionUrl == null || actionUrl.isEmpty) return null;

    final uri = Uri.tryParse(actionUrl);
    if (uri == null) return null;

    final conversationId = uri.queryParameters['conversationId'] ??
        uri.queryParameters['conversaId'];
    if ((uri.path == '/app/chat' || uri.path == '/chat') &&
        conversationId != null) {
      return Uri(
        path: '/chat/$conversationId',
        queryParameters: _messageQuery(uri),
      ).toString();
    }

    final conversationMatch =
        RegExp(r'(?:/app)?/conversas/([^/?#]+)').firstMatch(uri.path);
    if (conversationMatch != null) {
      return Uri(
        path: '/chat/${conversationMatch.group(1)}',
        queryParameters: _messageQuery(uri),
      ).toString();
    }

    if (uri.path.startsWith('/app/projects/')) {
      return uri.path.replaceFirst('/app/projects', '/projects');
    }

    if (uri.path.startsWith('/app/notifications')) return '/notifications';

    return null;
  }

  Map<String, String>? _messageQuery(Uri uri) {
    final messageId =
        uri.queryParameters['messageId'] ?? uri.queryParameters['mensagemId'];
    if (messageId == null || messageId.isEmpty) return null;
    return <String, String>{'messageId': messageId};
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notificacoes')),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const LoadingIndicator(label: 'Carregando notificacoes...');
          }

          return RefreshIndicator(
            onRefresh: provider.loadNotifications,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                AppButton(
                  label: 'Marcar todas como lidas',
                  onPressed:
                      provider.unreadCount == 0 ? null : provider.markAllAsRead,
                ),
                const SizedBox(height: 16),
                if (provider.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      provider.errorMessage!,
                      style:
                          TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                if (provider.notifications.isEmpty)
                  const SizedBox(
                    height: 280,
                    child: EmptyState(
                      title: 'Nenhuma notificacao encontrada',
                      subtitle: 'Puxe para atualizar.',
                    ),
                  )
                else
                  ...provider.notifications.map(
                    (notification) => NotificationTile(
                      notification: notification,
                      onTap: () => _openNotification(notification),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
