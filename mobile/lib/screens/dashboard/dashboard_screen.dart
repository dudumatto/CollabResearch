import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/utils/project_status.dart';
import '../../providers/notification_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/dashboard/activity_chart.dart';
import '../../widgets/dashboard/recent_activity_list.dart';
import '../../widgets/dashboard/stats_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().loadProjects();
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ProjectProvider, NotificationProvider>(
      builder: (context, projectsProvider, notificationProvider, _) {
        final projects = projectsProvider.projects;
        final notifications = notificationProvider.notifications;
        final progress = projects.isEmpty
            ? 0
            : (projects
                        .map((project) =>
                            estimatedProjectProgress(project.status))
                        .reduce((left, right) => left + right) /
                    projects.length)
                .round();
        final inProgress = projects
            .where((project) => project.status.toUpperCase() == 'EM_ANDAMENTO')
            .length;

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () async {
              await Future.wait([
                projectsProvider.loadProjects(),
                notificationProvider.loadNotifications(),
              ]);
            },
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isCompact = constraints.maxWidth < 420;
                final horizontalPadding = isCompact ? 16.0 : 24.0;

                return ListView(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    20,
                    horizontalPadding,
                    24,
                  ),
                  children: [
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1180),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dashboard',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Resumo dos seus projetos, conversas e alertas.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 18),
                            _StatsGrid(
                              children: [
                                StatsCard(
                                  title: 'Projetos',
                                  value: '${projects.length}',
                                ),
                                StatsCard(
                                  title: 'Progresso',
                                  value: '$progress%',
                                  icon: Icons.trending_up,
                                ),
                                StatsCard(
                                  title: 'Nao lidas',
                                  value:
                                      '${notificationProvider.unreadCount}',
                                ),
                                StatsCard(
                                  title: 'Atividades',
                                  value: '${notifications.length}',
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _DashboardContentGrid(
                              children: [
                                ActivityChart(
                                  projects: projects.length,
                                  conversations: inProgress,
                                  notifications: notifications.length,
                                ),
                                RecentActivityList(
                                  notifications: notifications,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 12.0;
        final columns = constraints.maxWidth >= 920
            ? 4
            : constraints.maxWidth >= 560
                ? 2
                : 1;
        final itemWidth =
            (constraints.maxWidth - (spacing * (columns - 1))) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final child in children)
              SizedBox(
                width: itemWidth,
                child: child,
              ),
          ],
        );
      },
    );
  }
}

class _DashboardContentGrid extends StatelessWidget {
  const _DashboardContentGrid({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 860) {
          return Column(
            children: [
              for (final child in children) ...[
                child,
                if (child != children.last) const SizedBox(height: 16),
              ],
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: children.first),
            const SizedBox(width: 16),
            Expanded(child: children.last),
          ],
        );
      },
    );
  }
}
