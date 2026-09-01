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
    final statusColor = projectStatusColor(context, project.status);

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (mobile) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: _StatusPill(
                label: statusLabel,
                color: statusColor,
                expanded: true,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              project.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
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
          SizedBox(height: mobile ? 10 : 8),
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
          SizedBox(height: mobile ? 16 : 14),
          Divider(color: Theme.of(context).colorScheme.outlineVariant),
          const SizedBox(height: 10),
          if (mobile)
            Wrap(
              spacing: 14,
              runSpacing: 8,
              children: [
                _ProjectMetric(
                  icon: Icons.work_outline,
                  label:
                      '${project.collaborators} de ${project.vacancies} vagas',
                  wrap: true,
                ),
                _ProjectMetric(
                  icon: Icons.groups_outlined,
                  label: '${project.collaborators} na equipe',
                  wrap: true,
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 18,
                  color: Theme.of(context).colorScheme.primary,
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
  const _StatusPill({
    required this.label,
    required this.color,
    this.expanded = false,
  });

  final String label;
  final Color color;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: expanded ? 148 : 116),
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
            overflow: expanded ? TextOverflow.visible : TextOverflow.ellipsis,
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
  const _ProjectMetric({
    required this.icon,
    required this.label,
    this.wrap = false,
  });

  final IconData icon;
  final String label;
  final bool wrap;

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
        if (wrap) Flexible(child: Text(label)) else Text(label),
      ],
    );
  }
}
