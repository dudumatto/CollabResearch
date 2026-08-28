import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/project_status.dart';
import '../../models/project.dart';
import '../common/app_card.dart';

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

    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: AppCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    project.title,
                    // Mobile-only: preserva o titulo completo em cards estreitos.
                    maxLines: mobile ? null : 2,
                    overflow:
                        mobile ? TextOverflow.visible : TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right,
                  color: Theme.of(context).colorScheme.primary,
                ),
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
                  CircleAvatar(
                    radius: 15,
                    foregroundImage: project.advisorAvatarUrl != null
                        ? NetworkImage(project.advisorAvatarUrl!)
                        : null,
                    child: Text(project.advisorName![0].toUpperCase()),
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
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _InfoPill(
                  icon: Icons.flag_outlined,
                  label: statusLabel,
                  color: statusColor,
                  mobile: mobile,
                ),
                _InfoPill(
                  icon: Icons.work_outline,
                  label: '${project.vacancies} vagas',
                  mobile: mobile,
                ),
                _InfoPill(
                  icon: Icons.groups_outlined,
                  label: '${project.collaborators} colaboradores',
                  mobile: mobile,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({
    required this.icon,
    required this.label,
    this.color = AppColors.muted,
    this.mobile = false,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool mobile;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        child: Row(
          // Mobile-only: cada pill respeita a largura do card.
          mainAxisSize: mobile ? MainAxisSize.max : MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 6),
            if (mobile)
              Expanded(
                child: Text(
                  label,
                  softWrap: true,
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              )
            else
              Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
