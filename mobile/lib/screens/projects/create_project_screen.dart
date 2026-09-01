import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_dropdown.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_snackbar.dart';
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
  final _requirementsController = TextEditingController();
  final _technologiesController = TextEditingController();
  final _coverUrlController = TextEditingController();
  final _vacanciesController = TextEditingController(text: '1');
  DateTime? _startDate;
  DateTime? _endDate;
  DateTime? _applicationDeadline;
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
    _requirementsController.dispose();
    _technologiesController.dispose();
    _coverUrlController.dispose();
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
    if (_startDate != null &&
        _endDate != null &&
        _endDate!.isBefore(_startDate!)) {
      AppSnackbar.showError(
        context,
        'A data de fim não pode ser anterior à data de início.',
      );
      return;
    }
    if (_applicationDeadline != null &&
        _endDate != null &&
        _applicationDeadline!.isAfter(_endDate!)) {
      AppSnackbar.showError(
        context,
        'O limite de inscrições não pode ser posterior ao fim do projeto.',
      );
      return;
    }
    final areaId = _selectedAreaId;
    if (areaId == null) return;

    final data = <String, dynamic>{
      'titulo': _titleController.text.trim(),
      'descricao': _descriptionController.text.trim(),
      'requisitos': _requirementsController.text.trim(),
      'tecnologias': _technologiesController.text.trim(),
      'fotoProjetoUrl': _coverUrlController.text.trim().isEmpty
          ? null
          : _coverUrlController.text.trim(),
      'dataInicio': _dateText(_startDate),
      'dataFim': _dateText(_endDate),
      'dataLimiteInscricao': _dateText(_applicationDeadline),
      'areaId': areaId,
      'vagas': int.parse(_vacanciesController.text.trim()),
      if (_isStudent) 'orientadorId': _selectedAdvisorId,
    };
    final project = await context.read<ProjectProvider>().createProject(data);
    if (!mounted || project == null) return;
    context.go('/projects/${project.id}');
  }

  String? _dateText(DateTime? value) {
    if (value == null) return null;
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    return '${value.year}-$month-$day';
  }

  Future<void> _pickDate(
    DateTime? current,
    ValueChanged<DateTime?> onSelected,
  ) async {
    final selected = await showDatePicker(
      context: context,
      initialDate: current ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 3650)),
    );
    if (selected != null) setState(() => onSelected(selected));
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProjectProvider>();
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return Scaffold(
      appBar: AppBar(title: const Text('Criar projeto')),
      body: provider.isFormLoading
          ? const LoadingIndicator(label: 'Carregando opções...')
          : ListView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                isMobile ? 16 : 20,
                isMobile ? 16 : 20,
                isMobile ? 16 : 20,
                isMobile ? 112 : 20,
              ),
              children: [
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 720),
                    child: _ProjectFormSurface(
                      mobile: isMobile,
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
                                  ? 'O orientador escolhido receberá uma solicitação para analisar.'
                                  : 'O projeto será publicado sob sua orientação.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            if (provider.errorMessage != null) ...[
                              const SizedBox(height: 16),
                              AppErrorState(
                                message: provider.errorMessage!,
                                onRetry: _loadOptions,
                              ),
                            ],
                            const SizedBox(height: 24),
                            AppTextField(
                              label: 'Título',
                              controller: _titleController,
                              prefixIcon: Icons.title,
                              textInputAction: TextInputAction.next,
                              validator: (value) => Validators.requiredField(
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
                              validator: (value) => Validators.requiredField(
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
                              hintText: 'Separe os itens por virgula',
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Tecnologias e competencias',
                              controller: _technologiesController,
                              prefixIcon: Icons.science_outlined,
                              maxLines: 2,
                              hintText: 'Ex.: Flutter, UX research',
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
                              builder: (context, _) {
                                // Mobile-only: mede o espaco real do campo.
                                final isMobile =
                                    MediaQuery.sizeOf(context).width < 600;
                                return DropdownButtonFormField<int>(
                                  initialValue: dropdownValueIn(
                                      _selectedAreaId,
                                      provider.areas.map((area) => area.id),
                                  ),
                                  // Mobile-only: limita o item selecionado ao campo.
                                  isExpanded: isMobile,
                                  isDense: !isMobile,
                                  decoration: const InputDecoration(
                                    labelText: 'Área de pesquisa',
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
                                      ? 'Área de pesquisa obrigatória'
                                      : null,
                                );
                              },
                            ),
                            if (_isStudent) ...[
                              const SizedBox(height: 16),
                              LayoutBuilder(
                                builder: (context, _) {
                                  // Mobile-only: mede o espaco real do campo.
                                  final isMobile =
                                      MediaQuery.sizeOf(context).width < 600;
                                  return DropdownButtonFormField<int>(
                                    initialValue: dropdownValueIn(
                                      _selectedAdvisorId,
                                      provider.advisors.map((a) => a.id),
                                    ),
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
                                        ? 'Orientador obrigatório'
                                        : null,
                                  );
                                },
                              ),
                            ],
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
                            const SizedBox(height: 20),
                            Text(
                              'Datas do projeto',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            _DateField(
                              label: 'Inicio',
                              value: _startDate,
                              onTap: () => _pickDate(
                                _startDate,
                                (value) => _startDate = value,
                              ),
                            ),
                            const SizedBox(height: 8),
                            _DateField(
                              label: 'Fim',
                              value: _endDate,
                              onTap: () => _pickDate(
                                _endDate,
                                (value) => _endDate = value,
                              ),
                            ),
                            const SizedBox(height: 8),
                            _DateField(
                              label: 'Limite para inscrições',
                              value: _applicationDeadline,
                              onTap: () => _pickDate(
                                _applicationDeadline,
                                (value) => _applicationDeadline = value,
                              ),
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
                            if (provider.errorMessage == null &&
                                (provider.areas.isEmpty ||
                                    (_isStudent &&
                                        provider.advisors.isEmpty))) ...[
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

class _ProjectFormSurface extends StatelessWidget {
  const _ProjectFormSurface({required this.mobile, required this.child});

  final bool mobile;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (mobile) return child;
    return AppCard(padding: const EdgeInsets.all(24), child: child);
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = value == null
        ? 'Não definida'
        : '${value!.day.toString().padLeft(2, '0')}/${value!.month.toString().padLeft(2, '0')}/${value!.year}';
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.calendar_today_outlined),
          suffixIcon: const Icon(Icons.chevron_right),
        ),
        child: Text(text),
      ),
    );
  }
}
