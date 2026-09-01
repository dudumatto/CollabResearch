import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/date_utils.dart';
import '../../models/app_notification.dart';
import '../common/app_badge.dart';
import 'notification_presentation.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    this.onTap,
  });

  final AppNotification notification;
  final VoidCallback? onTap;

  /// Faixa lateral na cor da severidade. É ela que dá o ritmo de cor da lista.
  static const double _railWidth = 3;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isLight = theme.brightness == Brightness.light;
    final presentation = NotificationPresentation.of(notification.type);
    final severityColor = presentation.color(context);
    final isUnread = !notification.isRead;
    final title = presentation.titleFor(notification);
    final time = DateUtilsX.relative(notification.createdAt);

    return Semantics(
      button: onTap != null,
      label: [
        presentation.label,
        title,
        notification.description,
        time,
        isUnread ? 'Não lida' : 'Lida',
      ].where((part) => part.trim().isNotEmpty).join('. '),
      excludeSemantics: true,
      child: AnimatedPress(
        enabled: onTap != null,
        child: Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: Material(
            color: isUnread
                ? colorScheme.surfaceContainerLow
                : colorScheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
              side: BorderSide(
                color: isLight ? AppColors.border : AppColors.darkBorder,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Sinal 1 de 3 para lido/não lido — nunca só a cor.
                    Container(
                      width: _railWidth,
                      color: isUnread
                          ? severityColor
                          : severityColor.withValues(alpha: 0.25),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                // Mesma fórmula de tint do AppBadge, para
                                // haver uma regra só no app.
                                color: Color.lerp(
                                  colorScheme.surface,
                                  severityColor,
                                  0.14,
                                ),
                                borderRadius:
                                    BorderRadius.circular(AppRadius.sm),
                              ),
                              child: Icon(
                                presentation.icon,
                                color: severityColor,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      Flexible(
                                        child: AppBadge(
                                          label: presentation.label,
                                          color: severityColor,
                                        ),
                                      ),
                                      const SizedBox(width: AppSpacing.sm),
                                      Text(
                                        time,
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  Text(
                                    title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      // Sinal 2 de 3.
                                      fontWeight: isUnread
                                          ? FontWeight.w700
                                          : FontWeight.w500,
                                      color: isUnread
                                          ? colorScheme.onSurface
                                          : colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  if (notification.description
                                      .trim()
                                      .isNotEmpty) ...[
                                    const SizedBox(height: AppSpacing.xs),
                                    Text(
                                      notification.description,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style:
                                          theme.textTheme.bodySmall?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            // Sinal 3 de 3, no lugar do antigo chevron
                            // decorativo que não tinha rótulo nenhum.
                            SizedBox(
                              width: 8,
                              child: isUnread
                                  ? Container(
                                      width: 8,
                                      height: 8,
                                      margin: const EdgeInsets.only(top: 6),
                                      decoration: BoxDecoration(
                                        color: severityColor,
                                        shape: BoxShape.circle,
                                      ),
                                    )
                                  : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
