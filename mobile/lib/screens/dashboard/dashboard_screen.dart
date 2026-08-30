import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/collab_logo.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/academic/academic_widgets.dart';
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
      _loadAdvisorDashboard();
    });
  }

  bool get _isAdvisor {
    final user = context.read<AuthProvider>().currentUser;
    final role = user?.type ?? user?.roles.firstOrNull ?? '';
    return role.toUpperCase() == 'ORIENTADOR';
  }

  Future<void> _loadAdvisorDashboard() async {
    if (_isAdvisor) {
      await context.read<AcademicWorkspaceProvider>().loadAdvisorDashboard();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<DashboardProvider, NotificationProvider>(
      builder: (context, dashboardProvider, notificationProvider, _) {
        final summary = dashboardProvider.summary;
        final notifications = notificationProvider.notifications;
        final user = context.watch<AuthProvider>().currentUser;
        final academic = context.watch<AcademicWorkspaceProvider>();
        final isAdvisor =
            (user?.type ?? user?.roles.firstOrNull ?? '').toUpperCase() ==
                'ORIENTADOR';
        final advisorSummary = academic.advisorSummary;

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
                if (isAdvisor) academic.loadAdvisorDashboard(),
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
                              subtitle: isAdvisor
                                  ? 'Pendências de orientação, revisões e prazos.'
                                  : 'Resumo dos seus projetos, conversas e alertas.',
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
                                children: isAdvisor
                                    ? [
                                        StatsCard(
                                          title: 'Projetos ativos',
                                          value:
                                              '${advisorSummary?.activeProjects ?? 0}',
                                        ),
                                        StatsCard(
                                          title: 'Orientandos',
                                          value:
                                              '${advisorSummary?.activeAdvisees ?? 0}',
                                          icon: Icons.groups_outlined,
                                        ),
                                        StatsCard(
                                          title: 'Para revisar',
                                          value:
                                              '${advisorSummary?.deliveriesToReview ?? 0}',
                                          icon: Icons.rate_review_outlined,
                                        ),
                                        StatsCard(
                                          title: 'Etapas atrasadas',
                                          value:
                                              '${advisorSummary?.overdueStages ?? 0}',
                                          icon: Icons.event_busy_outlined,
                                        ),
                                      ]
                                    : [
                                        StatsCard(
                                          title: 'Projetos',
                                          value: '${summary?.myProjects ?? 0}',
                                        ),
                                        StatsCard(
                                          title: 'Inscricoes',
                                          value:
                                              '${summary?.mySubscriptions ?? 0}',
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
                                      ]),
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
                            const SizedBox(height: 20),
                            Text(
                              'Acompanhamento acadêmico',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Prazos, arquivos e retornos dos seus projetos.',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(height: 12),
                            _AcademicShortcuts(
                                children: isAdvisor
                                    ? [
                                        AcademicActionTile(
                                          icon: Icons.groups_outlined,
                                          title: 'Orientandos',
                                          description:
                                              'Progresso e pendências por estudante.',
                                          onTap: () =>
                                              context.push('/advisees'),
                                        ),
                                        AcademicActionTile(
                                          icon: Icons.rate_review_outlined,
                                          title: 'Entregas para revisar',
                                          description:
                                              'Abra versões e registre decisões.',
                                          onTap: () =>
                                              context.push('/deliveries'),
                                        ),
                                        AcademicActionTile(
                                          icon: Icons.fact_check_outlined,
                                          title: 'Avaliações',
                                          description:
                                              'Registre notas por etapa concluída.',
                                          onTap: () =>
                                              context.push('/evaluations'),
                                        ),
                                      ]
                                    : [
                                        AcademicActionTile(
                                          icon: Icons.event_note_outlined,
                                          title: 'Agenda',
                                          description:
                                              'Veja etapas próximas e atrasadas.',
                                          onTap: () => context.push('/agenda'),
                                        ),
                                        AcademicActionTile(
                                          icon: Icons.upload_file_outlined,
                                          title: 'Entregas',
                                          description:
                                              'Envie versões e acompanhe revisões.',
                                          onTap: () =>
                                              context.push('/deliveries'),
                                        ),
                                        AcademicActionTile(
                                          icon: Icons.fact_check_outlined,
                                          title: 'Avaliações',
                                          description:
                                              'Consulte notas e registre ciência.',
                                          onTap: () =>
                                              context.push('/evaluations'),
                                        ),
                                      ]),
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

class _AcademicShortcuts extends StatelessWidget {
  const _AcademicShortcuts({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 700) {
          return Column(
            children: [
              for (final child in children) ...[
                child,
                if (child != children.last) const SizedBox(height: 8),
              ],
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < children.length; index++) ...[
              Expanded(child: children[index]),
              if (index < children.length - 1) const SizedBox(width: 10),
            ],
          ],
        );
      },
    );
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({
    required this.name,
    required this.subtitle,
    this.avatarUrl,
  });

  final String name;
  final String? avatarUrl;
  final String subtitle;

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
                        subtitle,
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
