import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_spacing.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final shadows = isDark ? AppShadows.darkLow : AppShadows.lightLow;
    final card = Material(
      color: theme.colorScheme.surface,
      elevation: shadows.first.blurRadius / 10,
      shadowColor: shadows.first.color,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: onTap == null
          ? Padding(
              padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
              child: child,
            )
          : InkWell(
              onTap: onTap,
              child: Padding(
                padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
                child: child,
              ),
            ),
    );
    return onTap == null ? card : AnimatedPress(child: card);
  }
}
