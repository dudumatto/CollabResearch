import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/project_status.dart';
import '../../models/project.dart';
import '../../models/subscription.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_avatar.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_bottom_sheet.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/app_snackbar.dart';
import '../../widgets/common/empty_state.dart';

class ProjectDetailScreen extends StatefulWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  bool _initializing = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final projects = context.read<ProjectProvider>();
    final project = await projects.loadProject(
      widget.projectId,
      forceRefresh: true,
    );
    if (!mounted || project == null) {
      if (mounted) setState(() => _initializing = false);
      return;
    }

    final user = context.read<AuthProvider>().currentUser;
    final type = _userType(user);
    final isAdvisor = type == 'ORIENTADOR' && project.advisorId == user?.id;
    final canManage = isAdvisor &&
        project.status.toUpperCase() != 'FINALIZADO' &&
        !const {'PENDENTE_ORIENTADOR', 'REJEITADO_ORIENTADOR'}
            .contains(project.status.toUpperCase());

    await Future.wait([
      projects.loadCollaborators(project.id),
      if (type == 'ALUNO') context.read<SubscriptionProvider>().load(),
      if (canManage)
        context.read<SubscriptionProvider>().loadForProject(project.id),
    ]);
    if (mounted) setState(() => _initializing = false);
  }

  Future<bool> _confirm({
    required String title,
    required String message,
    required String action,
    bool destructive = false,
  }) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(title),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Voltar'),
              ),
              FilledButton(
                style: destructive
                    ? FilledButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.error,
                        foregroundColor: Theme.of(context).colorScheme.onError,
                      )
                    : null,
                onPressed: () => Navigator.pop(context, true),
                child: Text(action),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _subscribe(Project project) async {
    final controller = TextEditingController();
    final motivation = await AppBottomSheet.show<String>(
      context,
      title: 'Inscrição no projeto',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Conte brevemente por que você quer participar. Este campo é opcional.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            minLines: 3,
            maxLines: 6,
            maxLength: 1500,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Motivação',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Enviar inscrição'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (motivation == null || !mounted) return;

    final subscriptions = context.read<SubscriptionProvider>();
    final success = await subscriptions.subscribe(
      project.id,
      motivation: motivation,
    );
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Inscrição enviada.');
      await context
          .read<ProjectProvider>()
          .loadProject(project.id, forceRefresh: true);
    } else {
      AppSnackbar.showError(
        context,
        subscriptions.errorMessage ?? 'Não foi possível enviar a inscrição.',
      );
    }
  }

  Future<void> _cancelSubscription(Subscription subscription) async {
    final confirmed = await _confirm(
      title: 'Cancelar inscrição?',
      message: 'Sua inscrição neste projeto será removida.',
      action: 'Cancelar inscrição',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    final provider = context.read<SubscriptionProvider>();
    final success = await provider.cancel(subscription.id);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Inscrição cancelada.');
      await _load();
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível cancelar a inscrição.',
      );
    }
  }

  Future<void> _reviewOrientation(Project project, bool accept) async {
    final confirmed = await _confirm(
      title: accept ? 'Aceitar orientação?' : 'Recusar orientação?',
      message: accept
          ? 'O projeto será aberto para inscrições sob sua orientação.'
          : 'A solicitação de orientação será recusada.',
      action: accept ? 'Aceitar' : 'Recusar',
      destructive: !accept,
    );
    if (!confirmed || !mounted) return;
    final provider = context.read<ProjectProvider>();
    final success = accept
        ? await provider.acceptOrientation(project.id)
        : await provider.rejectOrientation(project.id);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(
        context,
        accept ? 'Orientação aceita.' : 'Orientação recusada.',
      );
      await _load();
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível analisar a orientação.',
      );
    }
  }

  Future<void> _reviewApplication(
    Project project,
    Subscription subscription,
    bool approve,
  ) async {
    final confirmed = await _confirm(
      title: approve ? 'Aprovar inscrição?' : 'Recusar inscrição?',
      message: approve
          ? '${subscription.studentName ?? 'O aluno'} será adicionado à equipe.'
          : 'A inscrição de ${subscription.studentName ?? 'este aluno'} será recusada.',
      action: approve ? 'Aprovar' : 'Recusar',
      destructive: !approve,
    );
    if (!confirmed || !mounted) return;
    final subscriptions = context.read<SubscriptionProvider>();
    final success =
        await subscriptions.review(subscription.id, approve: approve);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(
        context,
        approve ? 'Inscrição aprovada.' : 'Inscrição recusada.',
      );
      await Future.wait([
        subscriptions.loadForProject(project.id),
        context.read<ProjectProvider>().loadCollaborators(project.id),
        context
            .read<ProjectProvider>()
            .loadProject(project.id, forceRefresh: true),
      ]);
    } else {
      AppSnackbar.showError(
        context,
        subscriptions.errorMessage ?? 'Não foi possível analisar a inscrição.',
      );
    }
  }

  Future<void> _removeCollaborator(Project project, User collaborator) async {
    final confirmed = await _confirm(
      title: 'Remover colaborador?',
      message: '${collaborator.name} perderá o acesso ao projeto.',
      action: 'Remover',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    final provider = context.read<ProjectProvider>();
    final success = await provider.removeCollaborator(
      project.id,
      collaborator.id,
    );
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Colaborador removido.');
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível remover o colaborador.',
      );
    }
  }

  Future<void> _changeStatus(Project project, String nextStatus) async {
    final finishing = nextStatus == 'FINALIZADO';
    final confirmed = await _confirm(
      title: finishing ? 'Finalizar projeto?' : 'Iniciar projeto?',
      message: finishing
          ? 'O projeto ficará somente para consulta. Etapas obrigatórias precisam estar concluídas.'
          : 'O projeto sairá da fase de inscrições e entrará em andamento.',
      action: finishing ? 'Finalizar' : 'Iniciar',
      destructive: finishing,
    );
    if (!confirmed || !mounted) return;
    final provider = context.read<ProjectProvider>();
    final success = await provider.updateStatus(project.id, nextStatus);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(
        context,
        finishing ? 'Projeto finalizado.' : 'Projeto iniciado.',
      );
      await _load();
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível alterar o status.',
      );
    }
  }

  Future<void> _deleteProject(Project project) async {
    final confirmed = await _confirm(
      title: 'Excluir projeto?',
      message: 'Esta ação remove o projeto e não pode ser desfeita.',
      action: 'Excluir projeto',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    final provider = context.read<ProjectProvider>();
    final success = await provider.deleteProject(project.id);
    if (!mounted) return;
    if (success) {
      await provider.setListMode(ProjectListMode.mine);
      if (!mounted) return;
      context.go('/projects');
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível excluir o projeto.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ProjectProvider>();
    final project = projects.findProject(widget.projectId);

    if ((_initializing || projects.isDetailLoading) && project == null) {
      return const Scaffold(body: ProjectDetailSkeleton());
    }
    if (project == null && projects.errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Projeto')),
        body: AppErrorState(message: projects.errorMessage!, onRetry: _load),
      );
    }
    if (project == null) {
      return const Scaffold(
        body: EmptyState(title: 'Projeto não encontrado'),
      );
    }

    final user = context.watch<AuthProvider>().currentUser;
    final subscriptions = context.watch<SubscriptionProvider>();
    final collaborators = projects.collaboratorsFor(project.id);
    final type = _userType(user);
    final status = project.status.toUpperCase();
    final isOwner = project.ownerId == user?.id;
    final isAdvisor = project.advisorId == user?.id;
    final pendingOrientation = status == 'PENDENTE_ORIENTADOR';
    final canReviewOrientation =
        type == 'ORIENTADOR' && isAdvisor && pendingOrientation;
    final canManage = isAdvisor &&
        status != 'FINALIZADO' &&
        !const {'PENDENTE_ORIENTADOR', 'REJEITADO_ORIENTADOR'}.contains(status);
    final canEdit = (isOwner || canManage) && status != 'FINALIZADO';
    final canDelete = canManage || (isOwner && pendingOrientation);
    final currentSubscription = subscriptions.currentForProject(project.id);
    final approvedParticipant =
        currentSubscription?.status.toUpperCase() == 'APROVADO' ||
            collaborators.any((person) => person.id == user?.id);
    final canUseWorkspace = (isOwner || isAdvisor || approvedParticipant) &&
        !const {'PENDENTE_ORIENTADOR', 'REJEITADO_ORIENTADOR'}.contains(status);
    final canSubscribe = type == 'ALUNO' &&
        !isOwner &&
        currentSubscription == null &&
        status == 'ABERTO' &&
        project.collaborators < project.vacancies;
    final projectApplications = subscriptions
        .forProject(project.id)
        .where((item) => item.studentUserId != user?.id)
        .toList();
    final mobile = MediaQuery.sizeOf(context).width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text(mobile ? 'Projeto' : 'Detalhes do projeto'),
        actions: [
          if (canEdit)
            IconButton(
              onPressed: projects.isActionLoading
                  ? null
                  : () => context.push('/projects/${project.id}/edit'),
              tooltip: 'Editar projeto',
              icon: const Icon(Icons.edit_outlined),
            ),
          if (canDelete)
            IconButton(
              onPressed: projects.isActionLoading
                  ? null
                  : () => _deleteProject(project),
              tooltip: 'Excluir projeto',
              icon: const Icon(Icons.delete_outline),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            mobile ? 14 : 24,
            mobile ? 10 : 24,
            mobile ? 14 : 24,
            40,
          ),
          children: [
            _ProjectSummary(project: project, mobile: mobile),
            if (projects.errorMessage != null) ...[
              const SizedBox(height: 12),
              _InlineMessage(
                message: projects.errorMessage!,
                onDismiss: projects.clearError,
              ),
            ],
            const SizedBox(height: 16),
            _DetailSection(
              title: 'Sobre o projeto',
              icon: Icons.description_outlined,
              mobile: mobile,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    project.description?.trim().isNotEmpty == true
                        ? project.description!
                        : 'Nenhuma descrição foi cadastrada.',
                  ),
                  if (project.requirements?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 16),
                    const _FieldLabel('Requisitos'),
                    const SizedBox(height: 5),
                    Text(project.requirements!),
                  ],
                  if (project.technologies?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 16),
                    const _FieldLabel('Tecnologias e competências'),
                    const SizedBox(height: 7),
                    Wrap(
                      spacing: 7,
                      runSpacing: 7,
                      children: [
                        for (final item in project.technologies!
                            .split(',')
                            .map((item) => item.trim())
                            .where((item) => item.isNotEmpty))
                          Chip(label: Text(item)),
                      ],
                    ),
                  ],
                  if (project.startDate != null ||
                      project.endDate != null ||
                      project.applicationDeadline != null) ...[
                    const SizedBox(height: 16),
                    _ProjectDates(project: project),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),
            _DetailSection(
              title: 'Equipe',
              icon: Icons.groups_outlined,
              mobile: mobile,
              child: _TeamList(
                project: project,
                collaborators: collaborators,
                canManage: canManage,
                busy: projects.isActionLoading,
                onRemove: (collaborator) =>
                    _removeCollaborator(project, collaborator),
              ),
            ),
            if (canReviewOrientation ||
                canSubscribe ||
                currentSubscription != null ||
                canManage) ...[
              const SizedBox(height: 14),
              _DetailSection(
                title: 'Ações',
                icon: Icons.bolt_outlined,
                mobile: mobile,
                child: _ProjectActions(
                  project: project,
                  canReviewOrientation: canReviewOrientation,
                  canSubscribe: canSubscribe,
                  canManage: canManage,
                  currentSubscription: currentSubscription,
                  projectBusy: projects.isActionLoading,
                  subscriptionBusy: subscriptions.isActionLoading,
                  onAcceptOrientation: () => _reviewOrientation(project, true),
                  onRejectOrientation: () => _reviewOrientation(project, false),
                  onSubscribe: () => _subscribe(project),
                  onCancelSubscription: currentSubscription == null
                      ? null
                      : () => _cancelSubscription(currentSubscription),
                  onChangeStatus: (next) => _changeStatus(project, next),
                ),
              ),
            ],
            if (canManage) ...[
              const SizedBox(height: 14),
              _DetailSection(
                title: 'Inscrições',
                icon: Icons.assignment_ind_outlined,
                mobile: mobile,
                child: _ApplicationsList(
                  applications: projectApplications,
                  busy: subscriptions.isActionLoading,
                  onApprove: (item) => _reviewApplication(project, item, true),
                  onReject: (item) => _reviewApplication(project, item, false),
                ),
              ),
            ],
            if (canUseWorkspace) ...[
              const SizedBox(height: 14),
              _DetailSection(
                title: 'Acompanhamento',
                icon: Icons.route_outlined,
                mobile: mobile,
                child: _WorkspaceActions(projectId: project.id),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProjectSummary extends StatelessWidget {
  const _ProjectSummary({required this.project, required this.mobile});

  final Project project;
  final bool mobile;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: EdgeInsets.all(mobile ? 18 : 0),
      decoration: mobile
          ? BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: colors.primary.withValues(alpha: 0.12),
              ),
            )
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppBadge(
            label: formatProjectStatus(project.status),
            color: projectStatusColor(context, project.status),
          ),
          const SizedBox(height: 12),
          Text(
            project.title,
            style: (mobile
                    ? Theme.of(context).textTheme.headlineSmall
                    : Theme.of(context).textTheme.headlineMedium)
                ?.copyWith(fontWeight: FontWeight.w800, height: 1.16),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              if (project.area.trim().isNotEmpty)
                _Meta(icon: Icons.category_outlined, label: project.area),
              if (project.course.trim().isNotEmpty)
                _Meta(icon: Icons.school_outlined, label: project.course),
              _Meta(
                icon: Icons.work_outline,
                label: '${project.collaborators} de ${project.vacancies} vagas',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({
    required this.title,
    required this.icon,
    required this.child,
    required this.mobile,
  });

  final String title;
  final IconData icon;
  final Widget child;
  final bool mobile;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: colors.primary),
            const SizedBox(width: 8),
            Text(
              title,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
        ),
        const SizedBox(height: 14),
        child,
      ],
    );
    if (!mobile) return content;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
      ),
      child: content,
    );
  }
}

class _TeamList extends StatelessWidget {
  const _TeamList({
    required this.project,
    required this.collaborators,
    required this.canManage,
    required this.busy,
    required this.onRemove,
  });

  final Project project;
  final List<User> collaborators;
  final bool canManage;
  final bool busy;
  final ValueChanged<User> onRemove;

  @override
  Widget build(BuildContext context) {
    final people = <Widget>[];
    if (project.advisorName?.isNotEmpty == true) {
      people.add(_PersonTile(
        name: project.advisorName!,
        avatarUrl: project.advisorAvatarUrl,
        role: 'Orientador responsável',
      ));
    }
    if (project.ownerName?.isNotEmpty == true &&
        project.ownerId != project.advisorId) {
      people.add(_PersonTile(
        name: project.ownerName!,
        avatarUrl: project.ownerAvatarUrl,
        role: 'Autor do projeto',
      ));
    }
    for (final collaborator in collaborators) {
      if (collaborator.id == project.advisorId ||
          collaborator.id == project.ownerId) {
        continue;
      }
      people.add(_PersonTile(
        name: collaborator.name,
        avatarUrl: collaborator.avatarUrl,
        role: 'Colaborador',
        trailing: canManage
            ? IconButton(
                onPressed: busy ? null : () => onRemove(collaborator),
                tooltip: 'Remover ${collaborator.name}',
                icon: const Icon(Icons.person_remove_outlined),
              )
            : null,
      ));
    }
    if (people.isEmpty) {
      return Text(
        'A equipe ainda não possui participantes cadastrados.',
        style: Theme.of(context).textTheme.bodyMedium,
      );
    }
    return Column(
      children: [
        for (var index = 0; index < people.length; index++) ...[
          people[index],
          if (index < people.length - 1) const Divider(height: 18),
        ],
      ],
    );
  }
}

class _PersonTile extends StatelessWidget {
  const _PersonTile({
    required this.name,
    required this.role,
    this.avatarUrl,
    this.trailing,
  });

  final String name;
  final String role;
  final String? avatarUrl;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        AppAvatar(radius: 20, name: name, imageUrl: avatarUrl),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 2),
              Text(role, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _ProjectActions extends StatelessWidget {
  const _ProjectActions({
    required this.project,
    required this.canReviewOrientation,
    required this.canSubscribe,
    required this.canManage,
    required this.currentSubscription,
    required this.projectBusy,
    required this.subscriptionBusy,
    required this.onAcceptOrientation,
    required this.onRejectOrientation,
    required this.onSubscribe,
    required this.onCancelSubscription,
    required this.onChangeStatus,
  });

  final Project project;
  final bool canReviewOrientation;
  final bool canSubscribe;
  final bool canManage;
  final Subscription? currentSubscription;
  final bool projectBusy;
  final bool subscriptionBusy;
  final VoidCallback onAcceptOrientation;
  final VoidCallback onRejectOrientation;
  final VoidCallback onSubscribe;
  final VoidCallback? onCancelSubscription;
  final ValueChanged<String> onChangeStatus;

  @override
  Widget build(BuildContext context) {
    final status = project.status.toUpperCase();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (canReviewOrientation) ...[
          FilledButton.icon(
            onPressed: projectBusy ? null : onAcceptOrientation,
            icon: const Icon(Icons.check_rounded),
            label: const Text('Aceitar orientação'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: projectBusy ? null : onRejectOrientation,
            icon: const Icon(Icons.close_rounded),
            label: const Text('Recusar orientação'),
          ),
        ],
        if (canSubscribe)
          FilledButton.icon(
            onPressed: subscriptionBusy ? null : onSubscribe,
            icon: const Icon(Icons.person_add_alt_1_outlined),
            label: const Text('Inscrever-se'),
          ),
        if (currentSubscription != null) ...[
          _SubscriptionStatus(subscription: currentSubscription!),
          if (currentSubscription!.status.toUpperCase() == 'PENDENTE') ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: subscriptionBusy ? null : onCancelSubscription,
              child: const Text('Cancelar inscrição'),
            ),
          ],
        ],
        if (canManage && status == 'ABERTO')
          FilledButton.icon(
            onPressed:
                projectBusy ? null : () => onChangeStatus('EM_ANDAMENTO'),
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('Iniciar projeto'),
          ),
        if (canManage && status == 'EM_ANDAMENTO')
          FilledButton.icon(
            onPressed: projectBusy ? null : () => onChangeStatus('FINALIZADO'),
            icon: const Icon(Icons.flag_outlined),
            label: const Text('Finalizar projeto'),
          ),
      ],
    );
  }
}

class _ApplicationsList extends StatelessWidget {
  const _ApplicationsList({
    required this.applications,
    required this.busy,
    required this.onApprove,
    required this.onReject,
  });

  final List<Subscription> applications;
  final bool busy;
  final ValueChanged<Subscription> onApprove;
  final ValueChanged<Subscription> onReject;

  @override
  Widget build(BuildContext context) {
    if (applications.isEmpty) {
      return Text(
        'Nenhuma inscrição recebida.',
        style: Theme.of(context).textTheme.bodyMedium,
      );
    }
    return Column(
      children: [
        for (var index = 0; index < applications.length; index++) ...[
          _ApplicationTile(
            subscription: applications[index],
            busy: busy,
            onApprove: () => onApprove(applications[index]),
            onReject: () => onReject(applications[index]),
          ),
          if (index < applications.length - 1) const Divider(height: 24),
        ],
      ],
    );
  }
}

class _ApplicationTile extends StatelessWidget {
  const _ApplicationTile({
    required this.subscription,
    required this.busy,
    required this.onApprove,
    required this.onReject,
  });

  final Subscription subscription;
  final bool busy;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final pending = subscription.status.toUpperCase() == 'PENDENTE';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _PersonTile(
          name: subscription.studentName ?? 'Aluno',
          avatarUrl: subscription.studentAvatarUrl,
          role: _subscriptionLabel(subscription.status),
        ),
        if (subscription.motivation?.isNotEmpty == true) ...[
          const SizedBox(height: 8),
          Text(subscription.motivation!),
        ],
        if (pending) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: busy ? null : onApprove,
                  child: const Text('Aprovar'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: busy ? null : onReject,
                  child: const Text('Recusar'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _WorkspaceActions extends StatelessWidget {
  const _WorkspaceActions({required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AcademicActionTile(
          icon: Icons.event_note_outlined,
          title: 'Agenda do projeto',
          description: 'Etapas, responsáveis e prazos acadêmicos.',
          onTap: () => context.push('/agenda?projectId=$projectId'),
        ),
        const SizedBox(height: 8),
        AcademicActionTile(
          icon: Icons.upload_file_outlined,
          title: 'Entregas e versões',
          description: 'Arquivos enviados e decisões da revisão.',
          onTap: () => context.push('/deliveries?projectId=$projectId'),
        ),
        const SizedBox(height: 8),
        AcademicActionTile(
          icon: Icons.fact_check_outlined,
          title: 'Avaliações acadêmicas',
          description: 'Notas por etapa e registro de ciência.',
          onTap: () => context.push('/evaluations?projectId=$projectId'),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.push('/progress?projectId=$projectId'),
                icon: const Icon(Icons.trending_up),
                label: const Text('Progresso'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.push('/feedback?projectId=$projectId'),
                icon: const Icon(Icons.star_outline),
                label: const Text('Feedback'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ProjectDates extends StatelessWidget {
  const _ProjectDates({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 18,
      runSpacing: 10,
      children: [
        if (project.startDate != null)
          _Meta(
            icon: Icons.play_circle_outline,
            label: 'Início: ${_formatDate(project.startDate!)}',
          ),
        if (project.endDate != null)
          _Meta(
            icon: Icons.flag_outlined,
            label: 'Fim: ${_formatDate(project.endDate!)}',
          ),
        if (project.applicationDeadline != null)
          _Meta(
            icon: Icons.hourglass_bottom_rounded,
            label:
                'Inscrições até ${_formatDate(project.applicationDeadline!)}',
          ),
      ],
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 17, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 6),
        Flexible(child: Text(label)),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context)
          .textTheme
          .labelLarge
          ?.copyWith(fontWeight: FontWeight.w700),
    );
  }
}

class _SubscriptionStatus extends StatelessWidget {
  const _SubscriptionStatus({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final status = subscription.status.toUpperCase();
    final color = switch (status) {
      'APROVADO' => AppColors.success,
      'REJEITADO' => AppColors.danger,
      _ => AppColors.warning,
    };
    return Align(
      alignment: Alignment.centerLeft,
      child: AppBadge(
        label: 'Inscrição ${_subscriptionLabel(status).toLowerCase()}',
        color: color,
      ),
    );
  }
}

class _InlineMessage extends StatelessWidget {
  const _InlineMessage({required this.message, required this.onDismiss});

  final String message;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      decoration: BoxDecoration(
        color: colors.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: colors.onErrorContainer),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colors.onErrorContainer),
            ),
          ),
          IconButton(
            onPressed: onDismiss,
            tooltip: 'Fechar aviso',
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

String _userType(User? user) {
  return (user?.type ??
          (user?.roles.isNotEmpty == true ? user!.roles.first : ''))
      .toUpperCase();
}

String _subscriptionLabel(String status) {
  return switch (status.toUpperCase()) {
    'APROVADO' => 'Aprovada',
    'REJEITADO' => 'Recusada',
    _ => 'Pendente',
  };
}

String _formatDate(DateTime value) {
  return '${value.day.toString().padLeft(2, '0')}/'
      '${value.month.toString().padLeft(2, '0')}/${value.year}';
}
