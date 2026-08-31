import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_tokens.dart';
import '../../models/academic_workspace.dart';
import '../../models/project.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_snackbar.dart';

class DeliveriesScreen extends StatefulWidget {
  const DeliveriesScreen({super.key, this.projectId});

  final String? projectId;

  @override
  State<DeliveriesScreen> createState() => _DeliveriesScreenState();
}

class _DeliveriesScreenState extends State<DeliveriesScreen> {
  String? _selectedProjectId;

  bool get _isAdvisor {
    final user = context.read<AuthProvider>().currentUser;
    final role = user?.type ?? user?.roles.firstOrNull ?? '';
    return role.toUpperCase() == 'ORIENTADOR';
  }

  @override
  void initState() {
    super.initState();
    _selectedProjectId = widget.projectId;
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final related = context.read<ResearchActivityProvider>();
    await related.loadRelatedProjects();
    if (!mounted) return;
    setState(() {
      final requestedExists = related.relatedProjects
          .any((project) => project.id == _selectedProjectId);
      if (!requestedExists) {
        _selectedProjectId = related.relatedProjects.firstOrNull?.id;
      }
    });
    final id = _selectedProjectId;
    if (id != null) {
      await context.read<AcademicWorkspaceProvider>().loadProjectWorkspace(id);
    }
  }

  Future<PlatformFile?> _pickFile() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx', 'txt', 'zip'],
      withData: true,
    );
    return result?.files.singleOrNull;
  }

  Future<void> _createDelivery(Project project) async {
    final title = TextEditingController();
    final category = TextEditingController(text: 'DOCUMENTO');
    PlatformFile? file;
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.viewInsetsOf(context).bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Nova entrega',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextField(
                controller: title,
                onChanged: (_) => setSheetState(() {}),
                decoration: const InputDecoration(labelText: 'Título'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: category,
                decoration: const InputDecoration(labelText: 'Categoria'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await _pickFile();
                  if (picked != null) setSheetState(() => file = picked);
                },
                icon: const Icon(Icons.attach_file),
                label: Text(file?.name ?? 'Selecionar arquivo'),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: title.text.trim().isEmpty || file == null
                    ? null
                    : () => Navigator.pop(sheetContext, true),
                child: const Text('Enviar entrega'),
              ),
            ],
          ),
        ),
      ),
    );
    final titleText = title.text.trim();
    final categoryText = category.text.trim();
    title.dispose();
    category.dispose();
    if (submitted != true || file == null || !mounted) return;
    final success =
        await context.read<AcademicWorkspaceProvider>().createDelivery(
              projectId: project.id,
              title: titleText,
              category: categoryText,
              file: file!,
            );
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Entrega enviada.');
    } else {
      AppSnackbar.showError(context, 'Não foi possível enviar.');
    }
  }

  Future<void> _openVersions(DeliveryItem delivery) async {
    final academic = context.read<AcademicWorkspaceProvider>();
    final currentUserId = context.read<AuthProvider>().currentUser?.id;
    await academic.loadVersions(delivery.projectId, delivery.id);
    if (!mounted) return;
    final versions = academic.versionsByDelivery[delivery.id] ?? const [];
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.72,
        maxChildSize: 0.94,
        builder: (context, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            Text(delivery.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text('${versions.length} versões',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 16),
            for (final version in versions)
              Card(
                child: ListTile(
                  title: Text('v${version.number} · ${version.fileName}'),
                  subtitle: Text(
                    version.reviewComment ??
                        (version.decision == null
                            ? 'Aguardando revisão'
                            : version.decision!),
                  ),
                  trailing: PopupMenuButton<String>(
                    tooltip: 'Ações da versão',
                    onSelected: (action) {
                      Navigator.pop(context);
                      if (action == 'open') {
                        _openDeliveryFile(delivery, version);
                      } else if (action == 'review') {
                        _review(delivery, version);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'open',
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(Icons.open_in_new),
                          title: Text('Abrir arquivo'),
                        ),
                      ),
                      if (_isAdvisor && version.decision == null)
                        const PopupMenuItem(
                          value: 'review',
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.rate_review_outlined),
                            title: Text('Revisar'),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            if (delivery.canResubmit(
              userId: currentUserId,
              isAdvisor: _isAdvisor,
            )) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final file = await _pickFile();
                  if (file == null || !context.mounted) return;
                  Navigator.pop(context);
                  final success = await academic.resubmitDelivery(
                    delivery.projectId,
                    delivery.id,
                    file,
                  );
                  if (!mounted) return;
                  if (success) {
                    AppSnackbar.showSuccess(
                      this.context,
                      'Nova versão enviada.',
                    );
                  } else {
                    AppSnackbar.showError(
                      this.context,
                      academic.errorMessage ??
                          'Não foi possível enviar a nova versão.',
                    );
                  }
                },
                icon: const Icon(Icons.upload_file_outlined),
                label: const Text('Enviar nova versão'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _openDeliveryFile(
    DeliveryItem delivery,
    DeliveryVersion version,
  ) async {
    final academic = context.read<AcademicWorkspaceProvider>();
    final url = await academic.deliveryDownloadUrl(
      delivery.projectId,
      delivery.id,
      version.id,
    );
    if (!mounted) return;
    if (url == null) {
      AppSnackbar.showError(
        context,
        academic.errorMessage ??
            'O servidor não forneceu um link externo para este arquivo.',
      );
      return;
    }
    final opened = await launchUrl(url, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      AppSnackbar.showError(context, 'Não foi possível abrir o arquivo.');
    }
  }

  Future<void> _review(DeliveryItem delivery, DeliveryVersion version) async {
    final comment = TextEditingController();
    String decision = 'APPROVED';
    String? formError;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Revisar entrega'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: decision,
                items: const [
                  DropdownMenuItem(value: 'APPROVED', child: Text('Aprovar')),
                  DropdownMenuItem(
                    value: 'CHANGES_REQUESTED',
                    child: Text('Solicitar ajustes'),
                  ),
                ],
                onChanged: (value) => setDialogState(() {
                  decision = value ?? decision;
                  formError = null;
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: comment,
                onChanged: (_) {
                  if (formError != null) {
                    setDialogState(() => formError = null);
                  }
                },
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Comentário',
                  errorText: formError,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () {
                final validation = validateDeliveryReviewComment(
                  decision,
                  comment.text,
                );
                if (validation != null) {
                  setDialogState(
                    () => formError = validation,
                  );
                  return;
                }
                Navigator.pop(dialogContext, true);
              },
              child: const Text('Salvar revisão'),
            ),
          ],
        ),
      ),
    );
    final commentText = comment.text.trim();
    comment.dispose();
    if (confirmed != true || !mounted) return;
    final academic = context.read<AcademicWorkspaceProvider>();
    final success = await academic.reviewDelivery(
      projectId: delivery.projectId,
      deliveryId: delivery.id,
      versionId: version.id,
      decision: decision,
      comment: commentText,
    );
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Revisão registrada.');
    } else {
      AppSnackbar.showError(
        context,
        academic.errorMessage ?? 'Não foi possível salvar a revisão.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final related = context.watch<ResearchActivityProvider>();
    final academic = context.watch<AcademicWorkspaceProvider>();
    final selected = related.relatedProjects
        .where((project) => project.id == _selectedProjectId)
        .firstOrNull;
    final deliveries = selected == null
        ? const <DeliveryItem>[]
        : academic.deliveriesFor(selected.id);

    return Scaffold(
      floatingActionButton: !_isAdvisor && selected != null
          ? FloatingActionButton.extended(
              onPressed: () => _createDelivery(selected),
              icon: const Icon(Icons.upload_file_outlined),
              label: const Text('Nova entrega'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : AppSpacing.page.left;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                horizontal,
                MediaQuery.paddingOf(context).top + 16,
                horizontal, 88),
              children: [
                AcademicPageHeader(
                  onBack: () => context.canPop()
                      ? context.pop()
                      : context.go('/dashboard'),
                  eyebrow: _isAdvisor ? 'Revisão' : 'Produção acadêmica',
                  title: _isAdvisor ? 'Entregas da equipe' : 'Minhas entregas',
                  description: _isAdvisor
                      ? 'Acompanhe versões e registre a decisão da revisão.'
                      : 'Envie arquivos e acompanhe o retorno do orientador.',
                ),
                if (related.relatedProjects.isNotEmpty)
                  DropdownButtonFormField<String>(
                    initialValue: _selectedProjectId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Projeto',
                      prefixIcon: Icon(Icons.folder_outlined),
                    ),
                    items: [
                      for (final project in related.relatedProjects)
                        DropdownMenuItem(
                          value: project.id,
                          child: Text(project.title,
                              overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    onChanged: (value) async {
                      setState(() => _selectedProjectId = value);
                      if (value != null) {
                        await academic.loadProjectWorkspace(value);
                      }
                    },
                  ),
                const SizedBox(height: 20),
                if (academic.isLoading && deliveries.isEmpty)
                  const AcademicSkeletonList()
                else if (academic.errorMessage != null && deliveries.isEmpty)
                  AcademicErrorState(
                      message: academic.errorMessage!, onRetry: _load)
                else if (deliveries.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.upload_file_outlined,
                    title: 'Nenhuma entrega registrada',
                    description:
                        'As entregas e versões deste projeto aparecerão aqui.',
                  )
                else
                  for (final delivery in deliveries) ...[
                    Card(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        onTap: () => _openVersions(delivery),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Expanded(
                                  child: Text(delivery.title,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium),
                                ),
                                AcademicStatusBadge(delivery.status),
                              ]),
                              const SizedBox(height: 8),
                              Text(
                                [delivery.stageTitle, delivery.category]
                                    .whereType<String>()
                                    .where((item) => item.isNotEmpty)
                                    .join(' · '),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const SizedBox(height: 12),
                              Row(children: [
                                const Icon(Icons.history, size: 16),
                                const SizedBox(width: 6),
                                Text('${delivery.totalVersions} versões'),
                                const Spacer(),
                                const Icon(Icons.chevron_right),
                              ]),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                const SizedBox(height: 72),
              ],
            );
          },
        ),
      ),
    );
  }
}
