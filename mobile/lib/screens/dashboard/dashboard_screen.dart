import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/collab_logo.dart';
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
                            _DashboardHeader(
                              name: user?.name.isNotEmpty == true
                                  ? user!.name.split(' ').first
                                  : 'pesquisador',
                              avatarUrl: user?.avatarUrl,
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

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({required this.name, this.avatarUrl});

  final String name;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 360;

        return ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: ColoredBox(
            color: AppColors.primaryDark,
            child: Stack(
              children: [
                Positioned(
                  top: -22,
                  right: -26,
                  child: IgnorePointer(
                    child: Opacity(
                      opacity: 0.1,
                      child: CollabLogo(
                        full: false,
                        height: isCompact ? 104 : 120,
                        inverted: true,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(isCompact ? 16 : 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: isCompact ? 19 : 21,
                            backgroundColor: AppColors.surface,
                            foregroundImage: avatarUrl != null
                                ? NetworkImage(avatarUrl!)
                                : null,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: const TextStyle(
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text.rich(
                              TextSpan(
                                text: 'Olá, ',
                                children: [
                                  TextSpan(
                                    text: name,
                                    style: const TextStyle(
                                      color: AppColors.color1,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(color: AppColors.surface),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: isCompact ? 16 : 18),
                      Text(
                        'Dashboard',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: AppColors.surface,
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Resumo dos seus projetos, conversas e alertas.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.surface.withValues(alpha: 0.86),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
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
