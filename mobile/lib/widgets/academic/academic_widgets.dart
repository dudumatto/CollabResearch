import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';

class AcademicPageHeader extends StatelessWidget {
  const AcademicPageHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.description,
    this.trailing,
  });

  final String eyebrow;
  final String title;
  final String description;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                      ),
                ),
                const SizedBox(height: 6),
                Text(title, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 6),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 12),
            trailing!,
          ],
        ],
      ),
    );
  }
}

class AcademicStatusBadge extends StatelessWidget {
  const AcademicStatusBadge(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    final color = switch (normalized) {
      'DONE' ||
      'APROVADA' ||
      'APROVADO' ||
      'APPROVED' ||
      'CIENCIA_REGISTRADA' ||
      'FINALIZADO' =>
        AppColors.success,
      'REJEITADA' || 'REJEITADO' || 'REJECTED' => AppColors.danger,
      'ATRASADA' ||
      'OVERDUE' ||
      'AJUSTES_SOLICITADOS' ||
      'CHANGES_REQUESTED' ||
      'AGUARDANDO_CIENCIA' =>
        AppColors.warning,
      _ => Theme.of(context).colorScheme.primary,
    };
    final label = switch (normalized) {
      'PENDING_REVIEW' => 'AGUARDANDO REVISÃO',
      'CHANGES_REQUESTED' || 'AJUSTES_SOLICITADOS' => 'AJUSTES SOLICITADOS',
      'CIENCIA_REGISTRADA' => 'CIÊNCIA REGISTRADA',
      'AGUARDANDO_CIENCIA' => 'AGUARDANDO CIÊNCIA',
      _ => normalized.replaceAll('_', ' '),
    };
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class AcademicActionTile extends StatelessWidget {
  const AcademicActionTile({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return AnimatedPress(
      child: Material(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child:
                      Icon(icon, color: Theme.of(context).colorScheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      if (badge != null) ...[
                        const SizedBox(height: 5),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: AcademicStatusBadge(badge!),
                        ),
                      ],
                      const SizedBox(height: 3),
                      Text(
                        description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AcademicEmptyState extends StatelessWidget {
  const AcademicEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.action,
  });

  final IconData icon;
  final String title;
  final String description;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: Theme.of(context).colorScheme.primary),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            description,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (action != null) ...[
            const SizedBox(height: 16),
            action!,
          ],
        ],
      ),
    );
  }
}

class AcademicErrorState extends StatelessWidget {
  const AcademicErrorState({
    super.key,
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => AcademicEmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'Não foi possível carregar',
        description: message,
        action: OutlinedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: const Text('Tentar novamente'),
        ),
      );
}

class AcademicSkeletonList extends StatelessWidget {
  const AcademicSkeletonList({super.key, this.items = 4});

  final int items;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.surfaceContainerHighest;
    return Column(
      children: List.generate(
        items,
        (index) => Container(
          height: index == 0 ? 118 : 96,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
    );
  }
}
