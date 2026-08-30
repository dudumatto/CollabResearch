import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/project_status.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/projects/collaborator_list.dart';

class ProjectDetailScreen extends StatefulWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().loadProject(widget.projectId);
      context.read<SubscriptionProvider>().load();
    });
  }

  Future<void> _subscribe(ProjectProvider provider, String projectId) async {
    final subscribed = await provider.subscribeToProject(projectId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          subscribed
              ? 'Inscricao realizada.'
              : provider.errorMessage ?? 'Falha ao inscrever.',
        ),
      ),
    );
  }

  Future<void> _reviewOrientation(
    ProjectProvider provider,
    String projectId, {
    required bool accept,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(accept ? 'Aceitar orientação?' : 'Recusar orientação?'),
        content: Text(
          accept
              ? 'Você será registrado como orientador responsável por este projeto.'
              : 'O projeto ficará sem esta solicitação de orientação.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(accept ? 'Aceitar' : 'Recusar'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final success = accept
        ? await provider.acceptOrientation(projectId)
        : await provider.rejectOrientation(projectId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? accept
                  ? 'Orientacao aceita.'
                  : 'Orientacao recusada.'
              : provider.errorMessage ?? 'Nao foi possivel analisar o projeto.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhes do projeto')),
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
          final project = provider.findProject(widget.projectId);

          if (provider.isLoading && project == null) {
            return const LoadingIndicator(label: 'Carregando projeto...');
          }

          if (project == null) {
            return EmptyState(
              title: 'Projeto nao encontrado',
              subtitle: provider.errorMessage,
            );
          }

          final user = context.watch<AuthProvider>().currentUser;
          final userType = (user?.type ??
                  (user?.roles.isNotEmpty == true ? user!.roles.first : ''))
              .toUpperCase();
          final isOwner = project.ownerId == user?.id;
          final isResponsibleAdvisor = project.advisorId == user?.id;
          final isPending =
              project.status.toUpperCase() == 'PENDENTE_ORIENTADOR';
          final canReview =
              userType == 'ORIENTADOR' && isResponsibleAdvisor && isPending;
          final subscriptions = context.watch<SubscriptionProvider>();
          final currentSubscription = subscriptions.subscriptions
              .where((item) => item.projectId == project.id)
              .firstOrNull;
          final canSubscribe = userType == 'ALUNO' &&
              !isOwner &&
              !subscriptions.isLoading &&
              currentSubscription == null &&
              project.status.toUpperCase() == 'ABERTO' &&
              project.collaborators < project.vacancies;
          final canEdit = isOwner || isResponsibleAdvisor;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(project.title,
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              AppBadge(
                label: formatProjectStatus(project.status),
                color: projectStatusColor(project.status),
              ),
              const SizedBox(height: 24),
              Text(
                'Informacoes gerais',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(project.description?.isNotEmpty == true
                  ? project.description!
                  : 'Sem descricao cadastrada.'),
              const SizedBox(height: 16),
              Text(
                [project.area, project.course]
                    .where((value) => value.trim().isNotEmpty)
                    .join(' - '),
              ),
              const SizedBox(height: 24),
              Text('Colaboradores',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              CollaboratorList(
                name: project.advisorName ?? project.ownerName ?? 'Colaborador',
                avatarUrl: project.advisorAvatarUrl ?? project.ownerAvatarUrl,
                role: project.advisorName != null
                    ? 'Orientador do projeto'
                    : 'Responsavel pelo projeto',
              ),
              const SizedBox(height: 24),
              Text('Acoes', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (canReview) ...[
                AppButton(
                  label: 'Aceitar orientacao',
                  isLoading: provider.isLoading,
                  onPressed: () => _reviewOrientation(
                    provider,
                    project.id,
                    accept: true,
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: provider.isLoading
                      ? null
                      : () => _reviewOrientation(
                            provider,
                            project.id,
                            accept: false,
                          ),
                  child: const Text('Recusar orientacao'),
                ),
              ],
              if (canSubscribe) ...[
                AppButton(
                  label: 'Inscrever-se',
                  isLoading: provider.isLoading,
                  onPressed: () => _subscribe(provider, project.id),
                ),
              ],
              if (userType == 'ALUNO' && currentSubscription != null) ...[
                AppBadge(
                  label:
                      'Inscrição ${currentSubscription.status.toLowerCase()}',
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () => context.push('/subscriptions'),
                  icon: const Icon(Icons.assignment_outlined),
                  label: const Text('Ver minha inscrição'),
                ),
              ],
              if (canEdit) ...[
                if (canReview || canSubscribe) const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => context.go('/projects/${project.id}/edit'),
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Editar projeto'),
                ),
              ],
              if (!canReview && !canSubscribe && !canEdit)
                Text(
                  'Nenhuma acao disponivel para o seu perfil.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              if (canEdit) ...[
                const SizedBox(height: 24),
                Text(
                  'Acompanhamento',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                AcademicActionTile(
                  icon: Icons.event_note_outlined,
                  title: 'Agenda do projeto',
                  description: 'Etapas, responsáveis e prazos acadêmicos.',
                  onTap: () => context.push('/agenda?projectId=${project.id}'),
                ),
                const SizedBox(height: 8),
                AcademicActionTile(
                  icon: Icons.upload_file_outlined,
                  title: 'Entregas e versões',
                  description: 'Arquivos enviados e decisões da revisão.',
                  onTap: () =>
                      context.push('/deliveries?projectId=${project.id}'),
                ),
                const SizedBox(height: 8),
                AcademicActionTile(
                  icon: Icons.fact_check_outlined,
                  title: 'Avaliações acadêmicas',
                  description: 'Notas por etapa e registro de ciência.',
                  onTap: () =>
                      context.push('/evaluations?projectId=${project.id}'),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    TextButton.icon(
                      onPressed: () =>
                          context.push('/progress?projectId=${project.id}'),
                      icon: const Icon(Icons.trending_up),
                      label: const Text('Progresso'),
                    ),
                    TextButton.icon(
                      onPressed: () =>
                          context.push('/feedback?projectId=${project.id}'),
                      icon: const Icon(Icons.star_outline),
                      label: const Text('Feedback'),
                    ),
                    TextButton.icon(
                      onPressed: () => context.push('/subscriptions'),
                      icon: const Icon(Icons.assignment_outlined),
                      label: const Text('Inscrições'),
                    ),
                  ],
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
