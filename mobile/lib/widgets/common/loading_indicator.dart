import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key, this.label = 'Carregando...'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.82, end: 1),
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: child,
            ),
            child: const SizedBox(
              height: 30,
              width: 30,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
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
