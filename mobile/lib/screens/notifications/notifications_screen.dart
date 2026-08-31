import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/app_notification.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/notifications/notification_tile.dart';
import '../../widgets/common/app_snackbar.dart';

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
        _showSnackBar('Não foi possível marcar a notificação como lida.');
        return;
      }
    }

    final route = notification.mobileRoute;
    if (route != null && route != '/notifications') {
      if (mounted) context.go(route);
      return;
    }

    if (notification.type.toUpperCase() == 'MENSAGEM_RECEBIDA') {
      _showSnackBar(
          'Não foi possível identificar a conversa dessa notificação.');
    }
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    AppSnackbar.showError(context, message);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const NotificationListSkeleton();
          }

          if (provider.errorMessage != null) {
            return RefreshIndicator(
              onRefresh: provider.loadNotifications,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: AppErrorState(
                      message: provider.errorMessage!,
                      onRetry: provider.loadNotifications,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.loadNotifications,
            child: ListView(
              padding: EdgeInsets.fromLTRB(
                16,
                MediaQuery.paddingOf(context).top + 12,
                16,
                24,
              ),
              children: [
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 720),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const AppPageHeader(
                          eyebrow: 'Alertas',
                          title: 'Notificações',
                          description:
                              'Prazos, inscrições e mensagens do seu projeto.',
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                provider.unreadCount == 0
                                    ? 'Você está em dia.'
                                    : '${provider.unreadCount} não lida(s)',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: provider.unreadCount == 0
                                  ? null
                                  : provider.markAllAsRead,
                              icon: const Icon(Icons.done_all),
                              label: const Text('Marcar todas'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (provider.notifications.isEmpty)
                          const SizedBox(
                            height: 280,
                            child: EmptyState(
                              title: 'Nenhuma notificação encontrada',
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
