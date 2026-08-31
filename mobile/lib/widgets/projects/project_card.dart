import 'package:flutter/material.dart';

import '../../core/utils/project_status.dart';
import '../../models/project.dart';
import '../common/app_card.dart';
import '../common/app_avatar.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard({
    super.key,
    required this.project,
    this.onTap,
    this.mobile = false,
  });

  final Project project;
  final VoidCallback? onTap;
  final bool mobile;

  @override
  Widget build(BuildContext context) {
    final statusLabel = formatProjectStatus(project.status);
    final statusColor = projectStatusColor(project.status);

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (mobile) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    project.title,
                    overflow: TextOverflow.visible,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                const SizedBox(width: 10),
                _StatusPill(label: statusLabel, color: statusColor),
              ],
            ),
          ] else
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    project.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                const SizedBox(width: 8),
                _StatusPill(label: statusLabel, color: statusColor),
              ],
            ),
          const SizedBox(height: 8),
          if (mobile) ...[
            // Mobile-only: separa classificacoes longas sem ocultar dados.
            if (project.area.trim().isNotEmpty)
              Text(
                project.area,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            if (project.area.trim().isNotEmpty &&
                project.course.trim().isNotEmpty)
              const SizedBox(height: 2),
            if (project.course.trim().isNotEmpty)
              Text(
                project.course,
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ] else
            Text(
              '${project.area} - ${project.course}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          if (project.advisorName?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                AppAvatar(
                  radius: 15,
                  name: project.advisorName!,
                  imageUrl: project.advisorAvatarUrl,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${project.advisorName} (orientador)',
                    // Mobile-only: permite que nomes completos quebrem linha.
                    maxLines: mobile ? null : 1,
                    overflow:
                        mobile ? TextOverflow.visible : TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 14),
          Divider(color: Theme.of(context).colorScheme.outlineVariant),
          const SizedBox(height: 10),
          if (mobile)
            Wrap(
              spacing: 14,
              runSpacing: 8,
              children: [
                _ProjectMetric(
                  icon: Icons.work_outline,
                  label: '${project.vacancies} vagas',
                ),
                _ProjectMetric(
                  icon: Icons.groups_outlined,
                  label: '${project.collaborators} na equipe',
                ),
              ],
            )
          else
            Row(
              children: [
                _ProjectMetric(
                  icon: Icons.work_outline,
                  label: '${project.vacancies} vagas',
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _ProjectMetric(
                    icon: Icons.groups_outlined,
                    label: '${project.collaborators} na equipe',
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 116),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ),
    );
  }
}

class _ProjectMetric extends StatelessWidget {
  const _ProjectMetric({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 17,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 6),
        Text(label),
      ],
    );
  }
}
