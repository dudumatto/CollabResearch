import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/date_utils.dart';
import '../../models/app_notification.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    this.onTap,
  });

  final AppNotification notification;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent = _notificationColor(notification.type);
    final foreground = _notificationForeground(notification.type);
    final icon = _notificationIcon(notification.type);
    return AnimatedPress(
      enabled: onTap != null,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Material(
          color: notification.isRead
              ? colors.surface
              : accent.withValues(alpha: 0.045),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
            side: BorderSide(
              color: notification.isRead
                  ? AppColors.border
                  : accent.withValues(alpha: 0.55),
            ),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.13),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Icon(
                      icon,
                      color: accent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: accent.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 9,
                                        vertical: 4,
                                      ),
                                      child: Text(
                                        _notificationLabel(notification.type),
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: foreground,
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 7),
                                  Text(
                                    notification.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style:
                                        Theme.of(context).textTheme.titleSmall,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              DateUtilsX.relative(notification.createdAt),
                              style: Theme.of(context).textTheme.labelSmall,
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          notification.description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Color _notificationColor(String type) {
  final normalized = type.toUpperCase();
  if (normalized.contains('PRAZO') || normalized.contains('ATRAS')) {
    return AppColors.warning;
  }
  if (normalized.contains('MENSAGEM') || normalized.contains('COMENT')) {
    return AppColors.accent;
  }
  if (normalized.contains('REJEIT') || normalized.contains('ERRO')) {
    return AppColors.danger;
  }
  return AppColors.primary;
}

Color _notificationForeground(String type) {
  final normalized = type.toUpperCase();
  if (normalized.contains('PRAZO') || normalized.contains('ATRAS')) {
    return const Color(0xFFA16207);
  }
  if (normalized.contains('MENSAGEM') || normalized.contains('COMENT')) {
    return const Color(0xFF08736D);
  }
  if (normalized.contains('REJEIT') || normalized.contains('ERRO')) {
    return const Color(0xFFB91C1C);
  }
  return AppColors.primaryDark;
}

IconData _notificationIcon(String type) {
  final normalized = type.toUpperCase();
  if (normalized.contains('PRAZO') || normalized.contains('ATRAS')) {
    return Icons.alarm_outlined;
  }
  if (normalized.contains('MENSAGEM') || normalized.contains('COMENT')) {
    return Icons.chat_bubble_outline;
  }
  if (normalized.contains('ARQUIV') || normalized.contains('ENTREGA')) {
    return Icons.upload_file_outlined;
  }
  if (normalized.contains('PROJETO') || normalized.contains('INSCRICAO')) {
    return Icons.folder_outlined;
  }
  return Icons.notifications_none_outlined;
}

String _notificationLabel(String type) {
  final normalized = type.toUpperCase();
  if (normalized.contains('PRAZO') || normalized.contains('ATRAS')) {
    return 'Aviso';
  }
  if (normalized.contains('MENSAGEM') || normalized.contains('COMENT')) {
    return 'Comentário';
  }
  if (normalized.contains('ARQUIV') || normalized.contains('ENTREGA')) {
    return 'Arquivo';
  }
  if (normalized.contains('PROJETO') || normalized.contains('INSCRICAO')) {
    return 'Projeto';
  }
  return 'Sistema';
}
