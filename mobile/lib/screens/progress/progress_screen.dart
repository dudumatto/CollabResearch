import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/date_utils.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/app_snackbar.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
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
      await provider.loadProgress(_selectedProjectId!);
    }
  }

  Future<void> _selectProject(String? projectId) async {
    if (projectId == null) return;
    setState(() => _selectedProjectId = projectId);
    await context.read<ResearchActivityProvider>().loadProgress(projectId);
  }

  Future<void> _createProgress() async {
    final projectId = _selectedProjectId;
    if (projectId == null) return;
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    var type = 'ATUALIZACAO';

    final data = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Registrar progresso'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration:
                      const InputDecoration(labelText: 'Título (opcional)'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  decoration: const InputDecoration(labelText: 'Tipo'),
                  items: const [
                    DropdownMenuItem(
                      value: 'ATUALIZACAO',
                      child: Text('Atualização'),
                    ),
                    DropdownMenuItem(value: 'MARCO', child: Text('Marco')),
                    DropdownMenuItem(
                      value: 'BLOQUEIO',
                      child: Text('Bloqueio'),
                    ),
                  ],
                  onChanged: (value) =>
                      setDialogState(() => type = value ?? type),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionController,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'Descrição'),
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
              onPressed: () {
                final description = descriptionController.text.trim();
                if (description.isEmpty) return;
                Navigator.pop(dialogContext, {
                  'titulo': titleController.text.trim(),
                  'tipo': type,
                  'descricao': description,
                });
              },
              child: const Text('Registrar'),
            ),
          ],
        ),
      ),
    );
    titleController.dispose();
    descriptionController.dispose();
    if (!mounted || data == null) return;

    final provider = context.read<ResearchActivityProvider>();
    final success = await provider.createProgress(projectId, data);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Progresso registrado.');
    } else {
      AppSnackbar.showError(
        context,
        provider.errorMessage ?? 'Não foi possível registrar.',
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
    // _load() so roda no addPostFrameCallback, entao no primeiro frame
    // isLoading ainda e false e a lista esta vazia. Exigir isLoading aqui
    // deixava a tela afirmar "nenhum projeto relacionado" antes de ter
    // perguntado ao backend. Enquanto _initialized for false nao sabemos nada.
    if (!_initialized) {
      return const Scaffold(
        body: LoadingIndicator(label: 'Carregando progresso...'),
      );
    }

    return Scaffold(
      floatingActionButton: _selectedProjectId == null
          ? null
          : FloatingActionButton.extended(
              onPressed: provider.isLoading ? null : _createProgress,
              icon: const Icon(Icons.add),
              label: const Text('Registrar'),
            ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(
          20,
          MediaQuery.paddingOf(context).top + 16,
          20,
          20,
        ),
        children: [
          AppPageHeader(
            onBack: _goBack,
            eyebrow: 'Acompanhamento',
            title: 'Progresso do projeto',
            description: 'Registre marcos, bloqueios e atualizações da pesquisa.',
          ),
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
          // isLoading vem antes do estado vazio: na ordem inversa, uma
          // atualizacao que ainda nao respondeu mostrava "nenhum projeto"
          // em vez do indicador de progresso.
          if (provider.isLoading)
            const LoadingIndicator(label: 'Atualizando progresso...')
          else if (provider.relatedProjects.isEmpty)
            const SizedBox(
              height: 340,
              child: EmptyState(
                title: 'Nenhum projeto relacionado',
                subtitle:
                    'Participe de um projeto para acompanhar o progresso.',
              ),
            )
          else if (provider.progressEntries.isEmpty)
            const SizedBox(
              height: 280,
              child: EmptyState(
                title: 'Sem atualizações',
                subtitle: 'Registre a primeira atualizacao deste projeto.',
              ),
            )
          else
            for (final entry in provider.progressEntries) ...[
              AppCard(
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(
                    entry.type == 'BLOQUEIO'
                        ? Icons.warning_amber_outlined
                        : entry.type == 'MARCO'
                            ? Icons.flag_outlined
                            : Icons.trending_up,
                  ),
                  title: Text(entry.title ?? entry.type ?? 'Atualização'),
                  subtitle: Text(
                    [
                      entry.description,
                      if (entry.authorName != null) entry.authorName!,
                      if (entry.createdAt != null)
                        DateUtilsX.relative(entry.createdAt!),
                    ].join('\n'),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}
