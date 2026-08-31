import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../common/app_badge.dart';
import '../common/app_error_state.dart';
import '../common/app_skeleton.dart';
import '../common/empty_state.dart';

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
    // Cartao de destaque na cor da marca, no mesmo padrao do login, cadastro e
    // dashboard. Antes era texto solto sobre o fundo claro, sem peso visual.
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
          borderRadius: BorderRadius.circular(24),
        ),
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
                          color: Colors.white.withValues(alpha: 0.85),
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          height: 1.15,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                  ),
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 12),
              trailing!,
            ],
          ],
        ),
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
    // Delega a aparencia para AppBadge: a logica de status/rotulo acima e
    // dominio deste widget, o desenho e do design system.
    return AppBadge(label: label, color: color);
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
    // Camada fina sobre EmptyState para que todas as telas usem o mesmo
    // estado vazio, com a mesma animacao de entrada.
    return EmptyState(
      icon: icon,
      title: title,
      subtitle: description,
      action: action,
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

  // Camada fina sobre AppErrorState: um unico estado de erro no app inteiro,
  // com o mesmo botao de "Tentar novamente".
  @override
  Widget build(BuildContext context) =>
      AppErrorState(message: message, onRetry: onRetry);
}

class AcademicSkeletonList extends StatelessWidget {
  const AcademicSkeletonList({super.key, this.items = 4});

  final int items;

  @override
  Widget build(BuildContext context) {
    // Usa AppSkeleton para ter o shimmer real do design system, mantendo as
    // mesmas alturas para que a tela nao "pule" quando os dados chegam.
    return Column(
      children: List.generate(
        items,
        (index) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AppSkeleton(
            height: index == 0 ? 118 : 96,
            borderRadius: AppRadius.md,
          ),
        ),
      ),
    );
  }
}
