import 'package:flutter/material.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_spacing.dart';

class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key, this.label = 'Carregando...'});

  final String label;

  @override
  Widget build(BuildContext context) {
    final animationsDisabled = MediaQuery.disableAnimationsOf(context);
    final progress = SizedBox(
      height: 30,
      width: 30,
      child: CircularProgressIndicator(
        value: animationsDisabled ? 0.65 : null,
        strokeWidth: 2.5,
      ),
    );
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (animationsDisabled)
            progress
          else
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.82, end: 1),
              duration: AppDurations.normal,
              curve: AppCurves.enter,
              builder: (context, value, child) => Transform.scale(
                scale: value,
                child: child,
              ),
              child: progress,
            ),
          const SizedBox(height: AppSpacing.md),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}
