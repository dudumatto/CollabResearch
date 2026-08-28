import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_text_field.dart';
import '../../widgets/common/loading_indicator.dart';

class CreateProjectScreen extends StatefulWidget {
  const CreateProjectScreen({super.key});

  @override
  State<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends State<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _vacanciesController = TextEditingController(text: '1');
  int? _selectedAreaId;
  int? _selectedAdvisorId;

  bool get _isStudent {
    final user = context.read<AuthProvider>().currentUser;
    final type =
        user?.type ?? (user?.roles.isNotEmpty == true ? user!.roles.first : '');
    return type.toUpperCase() == 'ALUNO';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadOptions());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _vacanciesController.dispose();
    super.dispose();
  }

  Future<void> _loadOptions() async {
    final provider = context.read<ProjectProvider>();
    await provider.loadFormOptions(includeAdvisors: _isStudent);
    if (!mounted) return;
    setState(() {
      _selectedAreaId ??=
          provider.areas.isEmpty ? null : provider.areas.first.id;
      _selectedAdvisorId ??= !_isStudent || provider.advisors.isEmpty
          ? null
          : provider.advisors.first.id;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final areaId = _selectedAreaId;
    if (areaId == null) return;

    final data = <String, dynamic>{
      'titulo': _titleController.text.trim(),
      'descricao': _descriptionController.text.trim(),
      'areaId': areaId,
      'vagas': int.parse(_vacanciesController.text.trim()),
      if (_isStudent) 'orientadorId': _selectedAdvisorId,
    };
    final project = await context.read<ProjectProvider>().createProject(data);
    if (!mounted || project == null) return;
    context.go('/projects/${project.id}');
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProjectProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Criar projeto')),
      body: provider.isFormLoading
          ? const LoadingIndicator(label: 'Carregando opcoes...')
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
                              'Dados do projeto',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _isStudent
                                  ? 'O orientador escolhido recebera uma solicitacao para analisar.'
                                  : 'O projeto sera publicado sob sua orientacao.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            if (provider.errorMessage != null) ...[
                              const SizedBox(height: 16),
                              Text(
                                provider.errorMessage!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),
                            AppTextField(
                              label: 'Titulo',
                              controller: _titleController,
                              prefixIcon: Icons.title,
                              textInputAction: TextInputAction.next,
                              validator: (value) => Validators.requiredField(
                                value,
                                label: 'Titulo',
                              ),
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Descricao',
                              controller: _descriptionController,
                              prefixIcon: Icons.notes_outlined,
                              maxLines: 4,
                              validator: (value) => Validators.requiredField(
                                value,
                                label: 'Descricao',
                              ),
                            ),
                            const SizedBox(height: 16),
                            LayoutBuilder(
                              builder: (context, fieldConstraints) {
                                // Mobile-only: mede o espaco real do campo.
                                final isMobile =
                                    fieldConstraints.maxWidth <= 480;
                                return DropdownButtonFormField<int>(
                                  initialValue: _selectedAreaId,
                                  // Mobile-only: limita o item selecionado ao campo.
                                  isExpanded: isMobile,
                                  isDense: !isMobile,
                                  decoration: const InputDecoration(
                                    labelText: 'Area de pesquisa',
                                    prefixIcon: Icon(Icons.category_outlined),
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
                                  onChanged: (value) =>
                                      setState(() => _selectedAreaId = value),
                                  validator: (value) => value == null
                                      ? 'Area de pesquisa obrigatoria'
                                      : null,
                                );
                              },
                            ),
                            if (_isStudent) ...[
                              const SizedBox(height: 16),
                              LayoutBuilder(
                                builder: (context, fieldConstraints) {
                                  // Mobile-only: mede o espaco real do campo.
                                  final isMobile =
                                      fieldConstraints.maxWidth <= 480;
                                  return DropdownButtonFormField<int>(
                                    initialValue: _selectedAdvisorId,
                                    // Mobile-only: nomes longos podem quebrar linha.
                                    isExpanded: isMobile,
                                    isDense: !isMobile,
                                    decoration: const InputDecoration(
                                      labelText: 'Orientador',
                                      prefixIcon: Icon(
                                          Icons.workspace_premium_outlined),
                                    ),
                                    items: [
                                      for (final advisor in provider.advisors)
                                        DropdownMenuItem(
                                          value: advisor.id,
                                          child: Text(
                                            advisor.name,
                                            maxLines: isMobile ? 2 : 1,
                                            softWrap: isMobile,
                                          ),
                                        ),
                                    ],
                                    onChanged: (value) => setState(
                                      () => _selectedAdvisorId = value,
                                    ),
                                    validator: (value) => value == null
                                        ? 'Orientador obrigatorio'
                                        : null,
                                  );
                                },
                              ),
                            ],
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Numero de vagas',
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
                            const SizedBox(height: 24),
                            AppButton(
                              label: 'Salvar projeto',
                              isLoading: provider.isLoading,
                              onPressed: provider.areas.isEmpty ||
                                      (_isStudent && provider.advisors.isEmpty)
                                  ? null
                                  : _save,
                            ),
                            if (provider.areas.isEmpty ||
                                (_isStudent && provider.advisors.isEmpty)) ...[
                              const SizedBox(height: 8),
                              TextButton.icon(
                                onPressed: _loadOptions,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Tentar carregar novamente'),
                              ),
                            ],
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
