import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/date_utils.dart';
import '../../models/app_notification.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_section_header.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/app_snackbar.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/notifications/notification_tile.dart';

enum _NotificationFilter { all, unread }

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  _NotificationFilter _filter = _NotificationFilter.all;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  Future<void> _openNotification(AppNotification notification) async {
    final provider = context.read<NotificationProvider>();
    if (!notification.isRead) {
      final marked = await provider.markAsRead(notification.id);
      if (!marked) return;
    }

    final route = notification.mobileRoute;
    if (route != null && route != '/notifications') {
      if (mounted) context.go(route);
      return;
    }

    if (notification.type.toUpperCase() == 'MENSAGEM_RECEBIDA' && mounted) {
      AppSnackbar.showError(
        context,
        'Não foi possível identificar a conversa dessa notificação.',
      );
    }
  }

  /// Erros de ação saem como aviso passageiro. Antes iam para o mesmo campo do
  /// erro de carga e substituíam a lista inteira por uma tela de erro.
  void _drainActionError(NotificationProvider provider) {
    if (provider.actionErrorMessage == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final message = provider.consumeActionError();
      if (message != null) AppSnackbar.showError(context, message);
    });
  }

  List<AppNotification> _visible(List<AppNotification> all) {
    if (_filter == _NotificationFilter.unread) {
      return all.where((notification) => !notification.isRead).toList();
    }
    return all;
  }

  /// Achata cabeçalhos de dia e notificações numa lista só, para o sliver
  /// continuar construindo sob demanda mesmo com agrupamento.
  List<_Row> _rows(List<AppNotification> visible) {
    // Agrupa por rótulo preservando a ordem que o provider já garantiu
    // (mais recente primeiro).
    final groups = <String, List<AppNotification>>{};
    final order = <String>[];
    for (final notification in visible) {
      final label = DateUtilsX.dayBucketLabel(notification.createdAt);
      final group = groups.putIfAbsent(label, () {
        order.add(label);
        return <AppNotification>[];
      });
      group.add(notification);
    }

    return [
      for (final label in order) ...[
        _HeaderRow(label, groups[label]!.length),
        ...groups[label]!.map(_TileRow.new),
      ],
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          _drainActionError(provider);

          if (provider.isLoading && provider.notifications.isEmpty) {
            return const NotificationListSkeleton();
          }

          // Só erro de carga com a lista vazia pode tomar a tela inteira.
          if (provider.errorMessage != null && provider.notifications.isEmpty) {
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

          final visible = _visible(provider.notifications);
          final rows = _rows(visible);

          return RefreshIndicator(
            onRefresh: provider.loadNotifications,
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    SliverPadding(
                      padding: EdgeInsets.fromLTRB(
                        AppSpacing.lg,
                        MediaQuery.paddingOf(context).top + AppSpacing.md,
                        AppSpacing.lg,
                        0,
                      ),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const AppPageHeader(
                              compact: true,
                              eyebrow: 'Alertas',
                              title: 'Notificações',
                              description:
                                  'Prazos, inscrições e mensagens do seu projeto.',
                            ),
                            _FilterBar(
                              filter: _filter,
                              total: provider.notifications.length,
                              unread: provider.unreadCount,
                              isMarkingAll: provider.isMarkingAll,
                              onChanged: (value) =>
                                  setState(() => _filter = value),
                              onMarkAll: provider.unreadCount == 0
                                  ? null
                                  : provider.markAllAsRead,
                            ),
                            const SizedBox(height: AppSpacing.md),
                          ],
                        ),
                      ),
                    ),
                    if (rows.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: _EmptyForFilter(filter: _filter),
                      )
                    else
                      SliverPadding(
                        padding: EdgeInsets.fromLTRB(
                          AppSpacing.lg,
                          0,
                          AppSpacing.lg,
                          AppSpacing.xl + MediaQuery.paddingOf(context).bottom,
                        ),
                        sliver: SliverList.builder(
                          itemCount: rows.length,
                          itemBuilder: (context, index) {
                            final row = rows[index];
                            if (row is _HeaderRow) {
                              return Padding(
                                padding: EdgeInsets.only(
                                  top: index == 0 ? 0 : AppSpacing.lg,
                                  bottom: AppSpacing.md,
                                ),
                                child: AppSectionHeader(
                                  title: row.label,
                                  subtitle: row.count == 1
                                      ? '1 notificação'
                                      : '${row.count} notificações',
                                ),
                              );
                            }
                            final notification = (row as _TileRow).notification;
                            return NotificationTile(
                              notification: notification,
                              onTap: () => _openNotification(notification),
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

sealed class _Row {
  const _Row();
}

class _HeaderRow extends _Row {
  const _HeaderRow(this.label, this.count);

  final String label;
  final int count;
}

class _TileRow extends _Row {
  const _TileRow(this.notification);

  final AppNotification notification;
}

/// Filtro de duas vias com a contagem no próprio rótulo: é aqui que a tela
/// responde "quantas tem".
class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.filter,
    required this.total,
    required this.unread,
    required this.isMarkingAll,
    required this.onChanged,
    required this.onMarkAll,
  });

  final _NotificationFilter filter;
  final int total;
  final int unread;
  final bool isMarkingAll;
  final ValueChanged<_NotificationFilter> onChanged;
  final VoidCallback? onMarkAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SegmentedButton<_NotificationFilter>(
              segments: [
                ButtonSegment(
                  value: _NotificationFilter.all,
                  label: Text('Todas ($total)'),
                ),
                ButtonSegment(
                  value: _NotificationFilter.unread,
                  label: Text('Não lidas ($unread)'),
                ),
              ],
              selected: {filter},
              showSelectedIcon: false,
              onSelectionChanged: (selection) => onChanged(selection.first),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        TextButton.icon(
          onPressed: isMarkingAll ? null : onMarkAll,
          style: TextButton.styleFrom(minimumSize: const Size(48, 44)),
          icon: isMarkingAll
              ? const SizedBox.square(
                  dimension: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.done_all, size: 20),
          label: const Text('Marcar todas'),
        ),
      ],
    );
  }
}

class _EmptyForFilter extends StatelessWidget {
  const _EmptyForFilter({required this.filter});

  final _NotificationFilter filter;

  @override
  Widget build(BuildContext context) {
    if (filter == _NotificationFilter.unread) {
      return const EmptyState(
        icon: Icons.mark_email_read_outlined,
        title: 'Tudo lido',
        subtitle: 'Você respondeu a todos os avisos. Toque em "Todas" para '
            'rever o histórico.',
      );
    }
    return const EmptyState(
      icon: Icons.notifications_none_outlined,
      title: 'Nenhuma notificação por aqui',
      subtitle: 'Avisos sobre prazos, inscrições e mensagens dos seus '
          'projetos aparecem nesta tela.',
    );
  }
}
