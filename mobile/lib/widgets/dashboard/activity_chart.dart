import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../common/app_card.dart';

class ActivityChart extends StatelessWidget {
  const ActivityChart({
    super.key,
    required this.projects,
    required this.conversations,
    required this.notifications,
  });

  final int projects;
  final int conversations;
  final int notifications;

  @override
  Widget build(BuildContext context) {
    final maxValue = [projects, conversations, notifications, 1]
        .reduce((a, b) => a > b ? a : b);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Resumo', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          SizedBox(
            height: 190,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _Bar(
                  label: 'Projetos',
                  value: projects,
                  maxValue: maxValue,
                  color: AppColors.primary,
                ),
                _Bar(
                  label: 'Em andamento',
                  value: conversations,
                  maxValue: maxValue,
                  color: AppColors.secondary,
                ),
                _Bar(
                  label: 'Alertas',
                  value: notifications,
                  maxValue: maxValue,
                  color: AppColors.accent,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({
    required this.label,
    required this.value,
    required this.maxValue,
    required this.color,
  });

  final String label;
  final int value;
  final int maxValue;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final height = (104 * (value / maxValue).clamp(0.08, 1)).toDouble();
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text(
              '$value',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: height,
              child: Container(
                width: 32,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 36,
              child: Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
