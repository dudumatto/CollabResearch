import 'package:flutter/material.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_spacing.dart';

enum AppButtonVariant { primary, secondary, text, icon }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final animationsDisabled = MediaQuery.disableAnimationsOf(context);
    final content = AnimatedSwitcher(
      duration: animationsDisabled ? AppDurations.instant : AppDurations.fast,
      switchInCurve: AppCurves.enter,
      switchOutCurve: AppCurves.exit,
      child: isLoading
          ? SizedBox(
              key: const ValueKey('loading'),
              height: 18,
              width: 18,
              child: CircularProgressIndicator(
                value: animationsDisabled ? 0.65 : null,
                strokeWidth: 2,
                color: variant == AppButtonVariant.primary
                    ? colorScheme.onPrimary
                    : colorScheme.primary,
              ),
            )
          : icon == null
              ? Text(label, key: const ValueKey('content'))
              : Row(
                  key: const ValueKey('content'),
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 19),
                    const SizedBox(width: AppSpacing.sm),
                    Flexible(child: Text(label)),
                  ],
                ),
    );

    final callback = isLoading ? null : onPressed;
    final button = switch (variant) {
      AppButtonVariant.primary =>
        FilledButton(onPressed: callback, child: content),
      AppButtonVariant.secondary =>
        OutlinedButton(onPressed: callback, child: content),
      AppButtonVariant.text => TextButton(onPressed: callback, child: content),
      AppButtonVariant.icon => IconButton.filledTonal(
          tooltip: label,
          onPressed: callback,
          icon: isLoading ? content : Icon(icon ?? Icons.arrow_forward_rounded),
        ),
    };

    if (variant == AppButtonVariant.icon) return button;
    return SizedBox(width: double.infinity, child: button);
  }
}
