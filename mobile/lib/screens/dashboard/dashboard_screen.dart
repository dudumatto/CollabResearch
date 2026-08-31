import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../providers/auth_provider.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/dashboard/project_status_chart.dart';
import '../../widgets/dashboard/recent_activity_list.dart';
import '../../widgets/dashboard/stats_card.dart';
import '../../widgets/common/app_avatar.dart';

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
      // Alimenta o grafico de situacao dos projetos. Usa o endpoint que ja
      // existe para "meus projetos", nao a listagem geral.
      context.read<ResearchActivityProvider>().loadRelatedProjects();
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

  Future<void> _refresh(
    DashboardProvider dashboardProvider,
    NotificationProvider notificationProvider,
    AcademicWorkspaceProvider academic,
    bool isAdvisor,
  ) {
    return Future.wait([
      dashboardProvider.load(),
      notificationProvider.loadNotifications(),
      context.read<ResearchActivityProvider>().loadRelatedProjects(),
      if (isAdvisor) academic.loadAdvisorDashboard(),
    ]);
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

        final isInitialLoading =
            (dashboardProvider.isLoading || notificationProvider.isLoading) &&
                summary == null &&
                notifications.isEmpty;
        if (isInitialLoading) {
          return const Scaffold(
            body: SafeArea(bottom: false, child: DashboardSkeleton()),
          );
        }

        final errorMessage =
            dashboardProvider.errorMessage ?? notificationProvider.errorMessage;
        if (errorMessage != null) {
          return Scaffold(
            body: SafeArea(
              bottom: false,
              child: RefreshIndicator(
              onRefresh: () => _refresh(
                dashboardProvider,
                notificationProvider,
                academic,
                isAdvisor,
              ),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: AppErrorState(
                      message: errorMessage,
                      onRetry: () => _refresh(
                        dashboardProvider,
                        notificationProvider,
                        academic,
                        isAdvisor,
                      ),
                    ),
                  ),
                ],
              ),
              ),
            ),
          );
        }

        return Scaffold(
          body: SafeArea(
            bottom: false,
            child: RefreshIndicator(
            onRefresh: () => _refresh(
              dashboardProvider,
              notificationProvider,
              academic,
              isAdvisor,
            ),
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
                              unreadCount: notificationProvider.unreadCount,
                              onOpenAlerts: () => context.go('/notifications'),
                            ),
                            const SizedBox(height: AppSpacing.xl),
                            _StatsGrid(
                                children: isAdvisor
                                    ? [
                                        StatsCard(
                                          title: 'Projetos ativos',
                                          value:
                                              '${advisorSummary?.activeProjects ?? 0}',
                                          icon: Icons.folder_open_outlined,
                                          color: AppColors.chartGreen,
                                        ),
                                        StatsCard(
                                          title: 'Orientandos',
                                          value:
                                              '${advisorSummary?.activeAdvisees ?? 0}',
                                          icon: Icons.groups_outlined,
                                          color: AppColors.chartIndigo,
                                        ),
                                        StatsCard(
                                          title: 'Para revisar',
                                          value:
                                              '${advisorSummary?.deliveriesToReview ?? 0}',
                                          icon: Icons.rate_review_outlined,
                                          color: AppColors.chartAmber,
                                        ),
                                        StatsCard(
                                          title: 'Etapas atrasadas',
                                          value:
                                              '${advisorSummary?.overdueStages ?? 0}',
                                          icon: Icons.event_busy_outlined,
                                          color: AppColors.danger,
                                        ),
                                      ]
                                    : [
                                        StatsCard(
                                          title: 'Projetos',
                                          value: '${summary?.myProjects ?? 0}',
                                          icon: Icons.folder_open_outlined,
                                          color: AppColors.chartGreen,
                                        ),
                                        StatsCard(
                                          title: 'Inscrições',
                                          value:
                                              '${summary?.mySubscriptions ?? 0}',
                                          icon: Icons.assignment_outlined,
                                          color: AppColors.chartIndigo,
                                        ),
                                        StatsCard(
                                          title: 'Pendentes',
                                          value:
                                              '${summary?.pendingSubscriptions ?? 0}',
                                          icon: Icons.pending_actions_outlined,
                                          color: AppColors.chartAmber,
                                        ),
                                        StatsCard(
                                          title: 'Não lidas',
                                          value:
                                              '${summary?.unreadNotifications ?? notificationProvider.unreadCount}',
                                          icon: Icons.notifications_none,
                                          color: AppColors.danger,
                                        ),
                                      ]),
                            const SizedBox(height: AppSpacing.xl),
                            Text(
                              'Ações rápidas',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            IntrinsicHeight(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    child: _QuickAction(
                                      onPressed: () =>
                                          context.go('/subscriptions'),
                                      icon: const Icon(
                                        Icons.assignment_outlined,
                                      ),
                                      label: 'Inscrições',
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.md),
                                  Expanded(
                                    child: _QuickAction(
                                      onPressed: () => context.go('/progress'),
                                      icon: const Icon(
                                        Icons.trending_up_outlined,
                                      ),
                                      label: 'Progresso',
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.md),
                                  Expanded(
                                    child: _QuickAction(
                                      onPressed: () => context.go('/feedback'),
                                      icon: const Icon(Icons.star_outline),
                                      label: 'Feedback',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xl),
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
                            const SizedBox(height: AppSpacing.xl),
                            _DashboardContentGrid(
                              children: [
                                ProjectStatusChart(
                                  projects: context
                                      .watch<ResearchActivityProvider>()
                                      .relatedProjects,
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
    required this.unreadCount,
    required this.onOpenAlerts,
    this.avatarUrl,
  });

  final String name;
  final String? avatarUrl;
  final String subtitle;
  final int unreadCount;
  final VoidCallback onOpenAlerts;

  @override
  Widget build(BuildContext context) {
    // Cartao de destaque na cor da marca, no lugar do texto solto sobre fundo
    // claro. Da o mesmo peso visual do cabecalho de login e cadastro.
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Início',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                        letterSpacing: 0.6,
                      ),
                ),
              ),
              _HeaderIconButton(
                icon: Icons.notifications_none_outlined,
                tooltip: 'Abrir alertas',
                onPressed: onOpenAlerts,
                count: unreadCount,
              ),
              const SizedBox(width: 10),
              AppAvatar(
                radius: 20,
                name: name,
                imageUrl: avatarUrl,
                backgroundColor: Colors.white.withValues(alpha: 0.22),
                foregroundColor: Colors.white,
                initials: name.isNotEmpty ? null : 'U',
              ),
            ],
          ),
          const SizedBox(height: 22),
          Text(
            'Olá, $name 👋',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.85),
                ),
          ),
        ],
      ),
    );
  }
}

/// Botao de icone do cabecalho verde, com contador sobreposto sem deslocar o
/// icone (mesmo problema que o Badge.count causava na barra inferior).
class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    required this.count,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: Colors.white.withValues(alpha: 0.18),
          shape: const CircleBorder(),
          clipBehavior: Clip.antiAlias,
          child: IconButton(
            onPressed: onPressed,
            tooltip: tooltip,
            icon: Icon(icon, color: Colors.white),
          ),
        ),
        if (count > 0)
          Positioned(
            top: 2,
            right: 2,
            child: Container(
              constraints: const BoxConstraints(minWidth: 18),
              height: 18,
              padding: const EdgeInsets.symmetric(horizontal: 5),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.danger,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: AppColors.primaryDark, width: 1.5),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  height: 1,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
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
        const spacing = AppSpacing.md;
        final columns = constraints.maxWidth >= AppBreakpoints.expanded
            ? 4
            : constraints.maxWidth >= 280
                ? 2
                : 1;
        final itemWidth =
            (constraints.maxWidth - (spacing * (columns - 1))) / columns;

        // Agrupa por linha e usa IntrinsicHeight para que os cartoes de uma
        // mesma linha fiquem com a mesma altura. Antes cada cartao crescia
        // sozinho conforme o rotulo, e a grade saia desalinhada.
        final rows = <List<Widget>>[];
        for (var index = 0; index < children.length; index += columns) {
          rows.add(
            children.sublist(
              index,
              (index + columns).clamp(0, children.length),
            ),
          );
        }

        return Column(
          children: [
            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) ...[
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (var i = 0; i < rows[rowIndex].length; i++) ...[
                      SizedBox(width: itemWidth, child: rows[rowIndex][i]),
                      if (i < rows[rowIndex].length - 1)
                        const SizedBox(width: spacing),
                    ],
                  ],
                ),
              ),
              if (rowIndex < rows.length - 1)
                const SizedBox(height: spacing),
            ],
          ],
        );
      },
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.onPressed,
    required this.icon,
    required this.label,
  });

  final VoidCallback onPressed;
  final Widget icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Ocupa a largura que o pai der, para acompanhar a grade dos cartoes.
    // Antes era uma caixa fixa de 104px dentro de um Wrap, que nao alinhava
    // com as colunas acima.
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(AppRadius.md),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(
            vertical: AppSpacing.md,
            horizontal: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: IconTheme(
                  data: const IconThemeData(color: Colors.white, size: 21),
                  child: icon,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: theme.textTheme.labelMedium,
              ),
            ],
          ),
        ),
      ),
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
        // Indexado em vez de comparar com children.last: a comparacao era por
        // identidade e descartava o separador quando dois filhos eram iguais.
        if (constraints.maxWidth < AppBreakpoints.expanded) {
          return Column(
            children: [
              for (var index = 0; index < children.length; index++) ...[
                children[index],
                if (index < children.length - 1)
                  const SizedBox(height: AppSpacing.lg),
              ],
            ],
          );
        }

        // Antes usava .first/.last, o que descartava em silencio um terceiro
        // filho no layout largo.
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < children.length; index++) ...[
              Expanded(child: children[index]),
              if (index < children.length - 1)
                const SizedBox(width: AppSpacing.lg),
            ],
          ],
        );
      },
    );
  }
}
