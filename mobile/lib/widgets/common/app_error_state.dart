import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_spacing.dart';
import 'app_button.dart';

class AppErrorState extends StatelessWidget {
  const AppErrorState({
    super.key,
    required this.message,
    required this.onRetry,
    this.title = 'Não foi possível carregar',
    this.retryLabel = 'Tentar novamente',
    this.icon = Icons.error_outline_rounded,
  });

  final String title;
  final String message;
  final String retryLabel;
  final VoidCallback onRetry;
  final IconData icon;

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
              Container(
                height: 56,
                width: 56,
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: Icon(
                  icon,
                  color: theme.colorScheme.onErrorContainer,
                  size: 28,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                message,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 240),
                child: AppButton(
                  label: retryLabel,
                  onPressed: onRetry,
                  variant: AppButtonVariant.secondary,
                  icon: Icons.refresh_rounded,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
