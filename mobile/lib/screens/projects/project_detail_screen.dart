import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/project_status.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
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
              Text('${project.area} - ${project.course}'),
              const SizedBox(height: 24),
              Text('Colaboradores',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              const CollaboratorList(),
              const SizedBox(height: 24),
              Text('Acoes', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              AppButton(
                label: 'Inscrever-se',
                isLoading: provider.isLoading,
                onPressed: () => _subscribe(provider, project.id),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.go('/projects/${project.id}/edit'),
                child: const Text('Editar projeto'),
              ),
            ],
          );
        },
      ),
    );
  }
}
