import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/loading_indicator.dart';
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
      context.read<DashboardProvider>().load();
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<DashboardProvider, NotificationProvider>(
      builder: (context, dashboardProvider, notificationProvider, _) {
        final summary = dashboardProvider.summary;
        final notifications = notificationProvider.notifications;
        final user = context.watch<AuthProvider>().currentUser;

        if (dashboardProvider.isLoading && summary == null) {
          return const Scaffold(
            body: LoadingIndicator(label: 'Carregando dashboard...'),
          );
        }

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () async {
              await Future.wait([
                dashboardProvider.load(),
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
                            Row(
                              children: [
                                CircleAvatar(
                                  foregroundImage: user?.avatarUrl != null
                                      ? NetworkImage(user!.avatarUrl!)
                                      : null,
                                  child: Text(user?.name.isNotEmpty == true
                                      ? user!.name[0].toUpperCase()
                                      : 'U'),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text.rich(
                                    TextSpan(
                                      text: 'Olá, ',
                                      children: [
                                        TextSpan(
                                          text: user?.name.isNotEmpty == true
                                              ? user!.name.split(' ').first
                                              : 'pesquisador',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                    style:
                                        Theme.of(context).textTheme.titleLarge,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),
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
                            if (dashboardProvider.errorMessage != null) ...[
                              Text(
                                dashboardProvider.errorMessage!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                              const SizedBox(height: 12),
                            ],
                            _StatsGrid(
                              children: [
                                StatsCard(
                                  title: 'Projetos',
                                  value: '${summary?.myProjects ?? 0}',
                                ),
                                StatsCard(
                                  title: 'Inscricoes',
                                  value: '${summary?.mySubscriptions ?? 0}',
                                  icon: Icons.assignment_outlined,
                                ),
                                StatsCard(
                                  title: 'Pendentes',
                                  value:
                                      '${summary?.pendingSubscriptions ?? 0}',
                                  icon: Icons.pending_actions_outlined,
                                ),
                                StatsCard(
                                  title: 'Nao lidas',
                                  value:
                                      '${summary?.unreadNotifications ?? notificationProvider.unreadCount}',
                                  icon: Icons.notifications_none,
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => context.go('/subscriptions'),
                                  icon: const Icon(Icons.assignment_outlined),
                                  label: const Text('Inscricoes'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => context.go('/progress'),
                                  icon: const Icon(Icons.trending_up),
                                  label: const Text('Progresso'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => context.go('/feedback'),
                                  icon: const Icon(Icons.star_outline),
                                  label: const Text('Feedback'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _DashboardContentGrid(
                              children: [
                                ActivityChart(
                                  projects: summary?.myProjects ?? 0,
                                  conversations:
                                      summary?.activeConversations ?? 0,
                                  notifications:
                                      summary?.unreadNotifications ?? 0,
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
