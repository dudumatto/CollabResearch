import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_tokens.dart';
import '../../models/academic_workspace.dart';
import '../../models/project.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';

class DeliveriesScreen extends StatefulWidget {
  const DeliveriesScreen({super.key, this.projectId});

  final String? projectId;

  @override
  State<DeliveriesScreen> createState() => _DeliveriesScreenState();
}

class _DeliveriesScreenState extends State<DeliveriesScreen> {
  String? _selectedProjectId;

  bool get _isAdvisor =>
      (context.read<AuthProvider>().currentUser?.type ?? '').toUpperCase() ==
      'ORIENTADOR';

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
      _selectedProjectId ??= related.relatedProjects.isEmpty
          ? null
          : related.relatedProjects.first.id;
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
        builder: (context, setSheetState) => Padding(
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
    if (submitted != true || file == null || !mounted) return;
    final success =
        await context.read<AcademicWorkspaceProvider>().createDelivery(
              projectId: project.id,
              title: title.text.trim(),
              category: category.text.trim(),
              file: file!,
            );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(success ? 'Entrega enviada.' : 'Não foi possível enviar.'),
    ));
  }

  Future<void> _openVersions(DeliveryItem delivery) async {
    final academic = context.read<AcademicWorkspaceProvider>();
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
                  trailing: _isAdvisor && version.decision == null
                      ? IconButton(
                          tooltip: 'Revisar',
                          onPressed: () {
                            Navigator.pop(context);
                            _review(delivery, version);
                          },
                          icon: const Icon(Icons.rate_review_outlined),
                        )
                      : AcademicStatusBadge(
                          version.decision ?? 'PENDING_REVIEW',
                        ),
                ),
              ),
            if (!_isAdvisor) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final file = await _pickFile();
                  if (file == null || !context.mounted) return;
                  Navigator.pop(context);
                  await academic.resubmitDelivery(
                    delivery.projectId,
                    delivery.id,
                    file,
                  );
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

  Future<void> _review(DeliveryItem delivery, DeliveryVersion version) async {
    final comment = TextEditingController();
    String decision = 'APPROVED';
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
                onChanged: (value) =>
                    setDialogState(() => decision = value ?? decision),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: comment,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Comentário'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Salvar revisão'),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true || !mounted) return;
    await context.read<AcademicWorkspaceProvider>().reviewDelivery(
          projectId: delivery.projectId,
          deliveryId: delivery.id,
          versionId: version.id,
          decision: decision,
          comment: comment.text.trim(),
        );
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
      appBar: AppBar(title: const Text('Entregas')),
      floatingActionButton: !_isAdvisor && selected != null
          ? FloatingActionButton.extended(
              onPressed: () => _createDelivery(selected),
              icon: const Icon(Icons.upload_file_outlined),
              label: const Text('Nova entrega'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.page,
          children: [
            AcademicPageHeader(
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
                      child:
                          Text(project.title, overflow: TextOverflow.ellipsis),
                    ),
                ],
                onChanged: (value) async {
                  setState(() => _selectedProjectId = value);
                  if (value != null) await academic.loadProjectWorkspace(value);
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
                                  style:
                                      Theme.of(context).textTheme.titleMedium),
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
        ),
      ),
    );
  }
}
