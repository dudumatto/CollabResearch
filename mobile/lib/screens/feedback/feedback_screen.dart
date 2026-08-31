import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/date_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/app_snackbar.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  String? _selectedProjectId;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final provider = context.read<ResearchActivityProvider>();
    await provider.loadRelatedProjects();
    if (!mounted) return;
    final requested =
        GoRouterState.of(context).uri.queryParameters['projectId'];
    final requestedExists =
        provider.relatedProjects.any((project) => project.id == requested);
    _selectedProjectId = requestedExists
        ? requested
        : provider.relatedProjects.isEmpty
            ? null
            : provider.relatedProjects.first.id;
    setState(() => _initialized = true);
    if (_selectedProjectId != null) {
      await provider.loadFeedback(_selectedProjectId!);
    }
  }

  Future<void> _selectProject(String? projectId) async {
    if (projectId == null) return;
    setState(() => _selectedProjectId = projectId);
    await context.read<ResearchActivityProvider>().loadFeedback(projectId);
  }

  bool _canCreateFeedback(ResearchActivityProvider provider) {
    final user = context.read<AuthProvider>().currentUser;
    final type = (user?.type ??
            (user?.roles.isNotEmpty == true ? user!.roles.first : ''))
        .toUpperCase();
    final project = provider.relatedProjects
        .where((item) => item.id == _selectedProjectId)
        .firstOrNull;
    return type == 'ALUNO' && project != null && project.ownerId != user?.id;
  }

  Future<void> _createFeedback() async {
    final projectId = _selectedProjectId;
    if (projectId == null) return;
    final commentController = TextEditingController();
    var rating = 5;
    final data = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Avaliar projeto'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: rating,
                  decoration: const InputDecoration(labelText: 'Nota'),
                  items: [
                    for (var value = 1; value <= 5; value++)
                      DropdownMenuItem(
                        value: value,
                        child: Text('$value de 5'),
                      ),
                  ],
                  onChanged: (value) =>
                      setDialogState(() => rating = value ?? rating),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: commentController,
                  maxLines: 4,
                  maxLength: 1000,
                  decoration: const InputDecoration(
                    labelText: 'Comentario (opcional)',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, {
                'projetoId': int.parse(projectId),
                'nota': rating,
                'comentario': commentController.text.trim(),
              }),
              child: const Text('Enviar'),
            ),
          ],
        ),
      ),
    );
    commentController.dispose();
    if (!mounted || data == null) return;

    final provider = context.read<ResearchActivityProvider>();
    final success = await provider.createFeedback(data);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Feedback enviado.');
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Nao foi possivel enviar.',
      );
    }
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    final projectId =
        GoRouterState.of(context).uri.queryParameters['projectId'];
    context.go(projectId == null ? '/dashboard' : '/projects/$projectId');
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResearchActivityProvider>();
    if (!_initialized && provider.isLoading) {
      return const Scaffold(
        body: LoadingIndicator(label: 'Carregando feedbacks...'),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _goBack,
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Voltar',
        ),
        title: const Text('Feedback'),
      ),
      floatingActionButton: !_canCreateFeedback(provider)
          ? null
          : FloatingActionButton.extended(
              onPressed: provider.isLoading ? null : _createFeedback,
              icon: const Icon(Icons.star_outline),
              label: const Text('Avaliar'),
            ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (provider.relatedProjects.isNotEmpty)
            DropdownButtonFormField<String>(
              initialValue: _selectedProjectId,
              decoration: const InputDecoration(
                labelText: 'Projeto',
                prefixIcon: Icon(Icons.folder_open_outlined),
              ),
              items: [
                for (final project in provider.relatedProjects)
                  DropdownMenuItem(
                    value: project.id,
                    child: Text(
                      project.title,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
              onChanged: _selectProject,
            ),
          if (provider.errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              provider.errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 16),
          if (provider.relatedProjects.isEmpty)
            const SizedBox(
              height: 340,
              child: EmptyState(
                title: 'Nenhum projeto relacionado',
                subtitle: 'Seus projetos e participacoes aparecerao aqui.',
              ),
            )
          else if (provider.isLoading)
            const LoadingIndicator(label: 'Atualizando feedbacks...')
          else if (provider.feedbackEntries.isEmpty)
            const SizedBox(
              height: 280,
              child: EmptyState(
                title: 'Sem feedbacks',
                subtitle: 'Este projeto ainda nao recebeu avaliacoes.',
              ),
            )
          else
            for (final entry in provider.feedbackEntries) ...[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        for (var index = 1; index <= 5; index++)
                          Icon(
                            index <= entry.rating
                                ? Icons.star
                                : Icons.star_border,
                            size: 20,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                      ],
                    ),
                    if (entry.comment != null) ...[
                      const SizedBox(height: 10),
                      Text(entry.comment!),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      [
                        entry.reviewerName ?? 'Aluno',
                        if (entry.createdAt != null)
                          DateUtilsX.relative(entry.createdAt!),
                      ].join(' - '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
