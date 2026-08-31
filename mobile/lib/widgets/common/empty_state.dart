import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_spacing.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.action,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeSlideIn(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Container(
                  height: 56,
                  width: 56,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Icon(icon, color: theme.colorScheme.primary, size: 28),
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              if (action != null) ...[
                const SizedBox(height: AppSpacing.lg),
                action!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
