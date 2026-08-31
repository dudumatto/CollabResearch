import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/validators.dart';
import '../../models/project.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/app_text_field.dart';
import '../../widgets/common/empty_state.dart';

class EditProjectScreen extends StatefulWidget {
  const EditProjectScreen({super.key, required this.projectId});

  final String projectId;

  @override
  State<EditProjectScreen> createState() => _EditProjectScreenState();
}

class _EditProjectScreenState extends State<EditProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _requirementsController = TextEditingController();
  final _technologiesController = TextEditingController();
  final _coverUrlController = TextEditingController();
  final _vacanciesController = TextEditingController();
  Project? _project;
  int? _selectedAreaId;
  bool _initialized = false;

  bool get _isAdvisor {
    final user = context.read<AuthProvider>().currentUser;
    final type =
        user?.type ?? (user?.roles.isNotEmpty == true ? user!.roles.first : '');
    return type.toUpperCase() == 'ORIENTADOR';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _requirementsController.dispose();
    _technologiesController.dispose();
    _coverUrlController.dispose();
    _vacanciesController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final provider = context.read<ProjectProvider>();
    final project = await provider.loadProject(widget.projectId);
    await provider.loadFormOptions(includeAdvisors: false);
    if (!mounted || project == null) return;

    final matchingArea = provider.areas.where(
      (area) => area.name.toLowerCase() == project.area.toLowerCase(),
    );
    final projectAreaAvailable = provider.areas.any(
      (area) => area.id == project.areaId,
    );
    setState(() {
      _project = project;
      _titleController.text = project.title;
      _descriptionController.text = project.description ?? '';
      _requirementsController.text = project.requirements ?? '';
      _technologiesController.text = project.technologies ?? '';
      _coverUrlController.text = project.coverUrl ?? '';
      _vacanciesController.text = '${project.vacancies}';
      _selectedAreaId = (projectAreaAvailable ? project.areaId : null) ??
          (matchingArea.isEmpty ? null : matchingArea.first.id);
      _initialized = true;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final areaId = _selectedAreaId;
    if (areaId == null) return;

    final project = await context.read<ProjectProvider>().updateProject(
      widget.projectId,
      {
        ...?_project?.preservedUpdatePayload(),
        'titulo': _titleController.text.trim(),
        'descricao': _descriptionController.text.trim(),
        'requisitos': _requirementsController.text.trim(),
        'tecnologias': _technologiesController.text.trim(),
        'fotoProjetoUrl': _coverUrlController.text.trim().isEmpty
            ? null
            : _coverUrlController.text.trim(),
        'areaId': areaId,
        if (_isAdvisor) 'vagas': int.parse(_vacanciesController.text.trim()),
      },
    );
    if (!mounted || project == null) return;
    context.go('/projects/${project.id}');
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProjectProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Editar projeto')),
      body: !_initialized && (provider.isLoading || provider.isFormLoading)
          ? const ProjectDetailSkeleton()
          : _project == null
              ? provider.errorMessage != null
                  ? AppErrorState(
                      message: provider.errorMessage!,
                      onRetry: _load,
                    )
                  : const EmptyState(title: 'Projeto não encontrado')
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 720),
                        child: AppCard(
                          padding: const EdgeInsets.all(24),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Informações do projeto',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                if (provider.errorMessage != null) ...[
                                  const SizedBox(height: 16),
                                  AppErrorState(
                                    message: provider.errorMessage!,
                                    onRetry: _load,
                                  ),
                                ],
                                const SizedBox(height: 24),
                                AppTextField(
                                  label: 'Título',
                                  controller: _titleController,
                                  prefixIcon: Icons.title,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) =>
                                      Validators.requiredField(
                                    value,
                                    label: 'Título',
                                  ),
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: 'Descrição',
                                  controller: _descriptionController,
                                  prefixIcon: Icons.notes_outlined,
                                  maxLines: 4,
                                  validator: (value) =>
                                      Validators.requiredField(
                                    value,
                                    label: 'Descrição',
                                  ),
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: 'Requisitos',
                                  controller: _requirementsController,
                                  prefixIcon: Icons.checklist_outlined,
                                  maxLines: 3,
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: 'Tecnologias e competencias',
                                  controller: _technologiesController,
                                  prefixIcon: Icons.science_outlined,
                                  maxLines: 2,
                                ),
                                const SizedBox(height: 16),
                                AppTextField(
                                  label: 'URL da imagem do projeto (opcional)',
                                  controller: _coverUrlController,
                                  prefixIcon: Icons.image_outlined,
                                  keyboardType: TextInputType.url,
                                ),
                                const SizedBox(height: 16),
                                LayoutBuilder(
                                  builder: (context, fieldConstraints) {
                                    // Mobile-only: mede o espaco real do campo.
                                    final isMobile =
                                        fieldConstraints.maxWidth <= 480;
                                    return DropdownButtonFormField<int>(
                                      initialValue: _selectedAreaId,
                                      // Mobile-only: limita nomes longos ao campo.
                                      isExpanded: isMobile,
                                      isDense: !isMobile,
                                      decoration: const InputDecoration(
                                        labelText: 'Área de pesquisa',
                                        prefixIcon:
                                            Icon(Icons.category_outlined),
                                      ),
                                      items: [
                                        for (final area in provider.areas)
                                          DropdownMenuItem(
                                            value: area.id,
                                            child: Text(
                                              area.name,
                                              maxLines: isMobile ? 2 : 1,
                                              softWrap: isMobile,
                                            ),
                                          ),
                                      ],
                                      onChanged: (value) => setState(
                                        () => _selectedAreaId = value,
                                      ),
                                      validator: (value) => value == null
                                          ? 'Área de pesquisa obrigatória'
                                          : null,
                                    );
                                  },
                                ),
                                if (_isAdvisor) ...[
                                  const SizedBox(height: 16),
                                  AppTextField(
                                    label: 'Número de vagas',
                                    controller: _vacanciesController,
                                    prefixIcon: Icons.groups_outlined,
                                    keyboardType: TextInputType.number,
                                    textInputAction: TextInputAction.done,
                                    validator: (value) {
                                      final required = Validators.requiredField(
                                        value,
                                        label: 'Vagas',
                                      );
                                      return required ??
                                          Validators.positiveInteger(
                                            value,
                                            label: 'Vagas',
                                          );
                                    },
                                  ),
                                ],
                                const SizedBox(height: 24),
                                AppButton(
                                  label: 'Atualizar projeto',
                                  isLoading: provider.isLoading,
                                  onPressed:
                                      provider.areas.isEmpty ? null : _save,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
