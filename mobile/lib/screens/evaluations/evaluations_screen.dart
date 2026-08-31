import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_tokens.dart';
import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';

class EvaluationsScreen extends StatefulWidget {
  const EvaluationsScreen({super.key, this.projectId});

  final String? projectId;

  @override
  State<EvaluationsScreen> createState() => _EvaluationsScreenState();
}

class _EvaluationsScreenState extends State<EvaluationsScreen> {
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
    final projects = context.read<ResearchActivityProvider>();
    await projects.loadRelatedProjects();
    if (!mounted) return;
    setState(() {
      final requestedExists = projects.relatedProjects
          .any((project) => project.id == _selectedProjectId);
      if (!requestedExists) {
        _selectedProjectId = projects.relatedProjects.firstOrNull?.id;
      }
    });
    await _loadSelected();
  }

  Future<void> _loadSelected() async {
    final projectId = _selectedProjectId;
    if (projectId == null) return;
    final academic = context.read<AcademicWorkspaceProvider>();
    await academic.loadProjectWorkspace(projectId);
    if (_isAdvisor && mounted) {
      await academic.loadAdvisees(projectId: projectId);
    }
  }

  Future<void> _acknowledge(AcademicEvaluation evaluation) async {
    final comment = TextEditingController();
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Registrar ciência',
              style: Theme.of(sheetContext).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              'Confirme que você leu a avaliação de ${evaluation.stageTitle ?? 'esta etapa'}.',
              style: Theme.of(sheetContext).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: comment,
              maxLines: 3,
              maxLength: 2000,
              decoration: const InputDecoration(
                labelText: 'Comentário opcional',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => Navigator.pop(sheetContext, true),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Confirmar ciência'),
            ),
          ],
        ),
      ),
    );
    final commentText = comment.text.trim();
    comment.dispose();
    if (confirmed != true || !mounted) return;
    final academic = context.read<AcademicWorkspaceProvider>();
    final success = await academic.acknowledgeEvaluation(
      evaluation.projectId,
      evaluation.id,
      commentText,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Ciência registrada.'
              : academic.errorMessage ?? 'Não foi possível registrar ciência.',
        ),
      ),
    );
  }

  Future<void> _editEvaluation({AcademicEvaluation? evaluation}) async {
    final projectId = _selectedProjectId;
    if (projectId == null) return;
    final academic = context.read<AcademicWorkspaceProvider>();
    if (academic.advisees.isEmpty) {
      await academic.loadAdvisees(projectId: projectId);
    }
    if (!mounted) return;
    final stages = academic.stagesFor(projectId).where((stage) => stage.isDone);
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _EvaluationFormSheet(
        evaluation: evaluation,
        advisees: academic.advisees,
        stages: stages.toList(),
      ),
    );
    if (result == null || !mounted) return;
    final success = await academic.saveEvaluation(
      projectId,
      result,
      evaluationId: evaluation?.id,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? evaluation == null
                  ? 'Avaliação registrada.'
                  : 'Avaliação atualizada.'
              : academic.errorMessage ?? 'Não foi possível salvar a avaliação.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ResearchActivityProvider>();
    final academic = context.watch<AcademicWorkspaceProvider>();
    final selected = projects.relatedProjects
        .where((project) => project.id == _selectedProjectId)
        .firstOrNull;
    final evaluations = selected == null
        ? const <AcademicEvaluation>[]
        : academic.evaluationsFor(selected.id);

    return Scaffold(
      appBar: AppBar(title: const Text('Avaliações')),
      floatingActionButton: _isAdvisor && selected != null
          ? FloatingActionButton.extended(
              onPressed: academic.isLoading ? null : _editEvaluation,
              icon: const Icon(Icons.add_comment_outlined),
              label: const Text('Nova avaliação'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : 20.0;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(horizontal, 16, horizontal, 88),
              children: [
                AcademicPageHeader(
                  eyebrow:
                      _isAdvisor ? 'Desempenho acadêmico' : 'Retorno privado',
                  title:
                      _isAdvisor ? 'Avaliações da equipe' : 'Minhas avaliações',
                  description: _isAdvisor
                      ? 'Registre notas por etapa concluída e acompanhe a ciência do estudante.'
                      : 'Consulte as notas do orientador e registre que recebeu o retorno.',
                ),
                if (projects.relatedProjects.isNotEmpty)
                  DropdownButtonFormField<String>(
                    initialValue: _selectedProjectId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Projeto',
                      prefixIcon: Icon(Icons.folder_outlined),
                    ),
                    items: [
                      for (final project in projects.relatedProjects)
                        DropdownMenuItem(
                          value: project.id,
                          child: Text(
                            project.title,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (value) async {
                      setState(() => _selectedProjectId = value);
                      await _loadSelected();
                    },
                  ),
                const SizedBox(height: 20),
                if (academic.isLoading && evaluations.isEmpty)
                  const AcademicSkeletonList(items: 3)
                else if (academic.errorMessage != null && evaluations.isEmpty)
                  AcademicErrorState(
                    message: academic.errorMessage!,
                    onRetry: _load,
                  )
                else if (evaluations.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.fact_check_outlined,
                    title: 'Nenhuma avaliação registrada',
                    description:
                        'As avaliações aparecerão após a conclusão das etapas.',
                  )
                else
                  for (final evaluation in evaluations) ...[
                    _EvaluationCard(
                      evaluation: evaluation,
                      isAdvisor: _isAdvisor,
                      busy: academic.isLoading,
                      onAcknowledge: () => _acknowledge(evaluation),
                      onEdit: () => _editEvaluation(evaluation: evaluation),
                    ),
                    const SizedBox(height: 12),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _EvaluationCard extends StatelessWidget {
  const _EvaluationCard({
    required this.evaluation,
    required this.isAdvisor,
    required this.busy,
    required this.onAcknowledge,
    required this.onEdit,
  });

  final AcademicEvaluation evaluation;
  final bool isAdvisor;
  final bool busy;
  final VoidCallback onAcknowledge;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final average = evaluation.average ??
        (evaluation.participation +
                evaluation.technicalQuality +
                evaluation.deadlineCompliance +
                evaluation.communication) /
            4;
    final criteria = <(String, int)>[
      ('Participação', evaluation.participation),
      ('Qualidade técnica', evaluation.technicalQuality),
      ('Prazos', evaluation.deadlineCompliance),
      ('Comunicação', evaluation.communication),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAdvisor
                            ? evaluation.studentName
                            : evaluation.stageTitle ?? 'Etapa do projeto',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isAdvisor
                            ? evaluation.stageTitle ?? 'Etapa do projeto'
                            : 'Orientador: ${evaluation.advisorName ?? '-'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      average.toStringAsFixed(1),
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                    ),
                    Text('média / 5',
                        style: Theme.of(context).textTheme.labelSmall),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            LayoutBuilder(
              builder: (context, constraints) {
                const gap = 8.0;
                final width = (constraints.maxWidth - gap) / 2;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (final criterion in criteria)
                      SizedBox(
                        width: width,
                        child: _CriterionScore(
                          label: criterion.$1,
                          score: criterion.$2,
                        ),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(height: 14),
            Text('Comentário do orientador',
                style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 4),
            Text(
              evaluation.advisorComment ??
                  'Nenhum comentário informado pelo orientador.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                AcademicStatusBadge(
                  evaluation.acknowledged
                      ? 'CIENCIA_REGISTRADA'
                      : 'AGUARDANDO_CIENCIA',
                ),
                if (isAdvisor && !evaluation.acknowledged)
                  TextButton.icon(
                    onPressed: busy ? null : onEdit,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Editar'),
                  ),
                if (!isAdvisor && !evaluation.acknowledged)
                  FilledButton.tonalIcon(
                    onPressed: busy ? null : onAcknowledge,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Registrar ciência'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CriterionScore extends StatelessWidget {
  const _CriterionScore({required this.label, required this.score});

  final String label;
  final int score;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 2,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            const SizedBox(width: 6),
            Text('$score/5', style: Theme.of(context).textTheme.titleSmall),
          ],
        ),
      ),
    );
  }
}

class _EvaluationFormSheet extends StatefulWidget {
  const _EvaluationFormSheet({
    required this.evaluation,
    required this.advisees,
    required this.stages,
  });

  final AcademicEvaluation? evaluation;
  final List<AdviseeSummary> advisees;
  final List<ProjectStage> stages;

  @override
  State<_EvaluationFormSheet> createState() => _EvaluationFormSheetState();
}

class _EvaluationFormSheetState extends State<_EvaluationFormSheet> {
  String? _studentId;
  String? _stageId;
  int _participation = 0;
  int _technicalQuality = 0;
  int _deadlineCompliance = 0;
  int _communication = 0;
  late final TextEditingController _comment;
  String? _error;

  @override
  void initState() {
    super.initState();
    _studentId = widget.evaluation?.studentId;
    _stageId = widget.evaluation?.stageId;
    _participation = widget.evaluation?.participation ?? 0;
    _technicalQuality = widget.evaluation?.technicalQuality ?? 0;
    _deadlineCompliance = widget.evaluation?.deadlineCompliance ?? 0;
    _communication = widget.evaluation?.communication ?? 0;
    _comment = TextEditingController(
      text: widget.evaluation?.advisorComment ?? '',
    );
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  void _submit() {
    final scores = [
      _participation,
      _technicalQuality,
      _deadlineCompliance,
      _communication,
    ];
    if (_studentId == null || _studentId!.isEmpty) {
      setState(() => _error = 'Selecione o aluno avaliado.');
      return;
    }
    if (_stageId == null || _stageId!.isEmpty) {
      setState(() => _error = 'Selecione uma etapa concluída.');
      return;
    }
    if (scores.any((score) => score < 1 || score > 5)) {
      setState(() => _error = 'Atribua uma nota de 1 a 5 em cada critério.');
      return;
    }
    if (_comment.text.trim().isEmpty) {
      setState(() => _error = 'Informe o comentário do orientador.');
      return;
    }
    dynamic identifier(String value) => int.tryParse(value) ?? value;
    Navigator.pop(context, <String, dynamic>{
      'alunoId': identifier(_studentId!),
      'etapaId': identifier(_stageId!),
      'participacao': _participation,
      'qualidadeTecnica': _technicalQuality,
      'cumprimentoDePrazos': _deadlineCompliance,
      'comunicacao': _communication,
      'comentarioOrientador': _comment.text.trim(),
    });
  }

  @override
  Widget build(BuildContext context) {
    final average = (_participation +
            _technicalQuality +
            _deadlineCompliance +
            _communication) /
        4;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.9,
      maxChildSize: 0.96,
      builder: (context, controller) => ListView(
        controller: controller,
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 24,
        ),
        children: [
          Text(
            widget.evaluation == null ? 'Nova avaliação' : 'Editar avaliação',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            'Avalie uma etapa concluída. A média é calculada automaticamente.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            initialValue: _studentId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Aluno avaliado'),
            items: [
              for (final advisee in widget.advisees)
                DropdownMenuItem(
                  value: advisee.studentId,
                  child: Text(advisee.name, overflow: TextOverflow.ellipsis),
                ),
            ],
            onChanged: widget.evaluation == null
                ? (value) => setState(() => _studentId = value)
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _stageId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Etapa concluída'),
            items: [
              for (final stage in widget.stages)
                DropdownMenuItem(
                  value: stage.id,
                  child: Text(stage.title, overflow: TextOverflow.ellipsis),
                ),
            ],
            onChanged: widget.evaluation == null
                ? (value) => setState(() => _stageId = value)
                : null,
          ),
          if (widget.stages.isEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Nenhuma etapa concluída está disponível neste projeto.',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 18),
          _ScorePicker(
            label: 'Participação',
            value: _participation,
            onChanged: (value) => setState(() => _participation = value),
          ),
          _ScorePicker(
            label: 'Qualidade técnica',
            value: _technicalQuality,
            onChanged: (value) => setState(() => _technicalQuality = value),
          ),
          _ScorePicker(
            label: 'Cumprimento de prazos',
            value: _deadlineCompliance,
            onChanged: (value) => setState(() => _deadlineCompliance = value),
          ),
          _ScorePicker(
            label: 'Comunicação',
            value: _communication,
            onChanged: (value) => setState(() => _communication = value),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _comment,
            maxLines: 4,
            maxLength: 2000,
            decoration: const InputDecoration(
              labelText: 'Comentário do orientador',
              alignLabelWithHint: true,
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Média ${average.toStringAsFixed(1)}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              FilledButton(
                onPressed: widget.stages.isEmpty ? null : _submit,
                child: Text(widget.evaluation == null
                    ? 'Registrar avaliação'
                    : 'Salvar alterações'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ScorePicker extends StatelessWidget {
  const _ScorePicker({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stars = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var score = 1; score <= 5; score++)
                IconButton(
                  tooltip: '$score de 5',
                  onPressed: () => onChanged(score),
                  icon: Icon(
                    score <= value ? Icons.star : Icons.star_border,
                    color: score <= value
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.outline,
                  ),
                  visualDensity: VisualDensity.compact,
                ),
            ],
          );
          if (constraints.maxWidth < 420) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label),
                const SizedBox(height: 4),
                stars,
              ],
            );
          }
          return Row(
            children: [
              Expanded(child: Text(label)),
              stars,
            ],
          );
        },
      ),
    );
  }
}
