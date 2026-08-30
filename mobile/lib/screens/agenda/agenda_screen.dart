import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_tokens.dart';
import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';

enum _AgendaFilter { upcoming, overdue, done, all }

class AgendaScreen extends StatefulWidget {
  const AgendaScreen({super.key, this.projectId});

  final String? projectId;

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> {
  _AgendaFilter _filter = _AgendaFilter.upcoming;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final projectsProvider = context.read<ResearchActivityProvider>();
    await projectsProvider.loadRelatedProjects();
    if (!mounted) return;
    final projects = widget.projectId == null
        ? projectsProvider.relatedProjects
        : projectsProvider.relatedProjects
            .where((project) => project.id == widget.projectId)
            .toList();
    await context.read<AcademicWorkspaceProvider>().loadAgenda(projects);
  }

  List<ProjectStage> _items(
    ResearchActivityProvider projects,
    AcademicWorkspaceProvider academic,
  ) {
    final selectedProjects = widget.projectId == null
        ? projects.relatedProjects
        : projects.relatedProjects
            .where((project) => project.id == widget.projectId)
            .toList();
    final all = selectedProjects
        .expand((project) => academic.stagesFor(project.id))
        .toList()
      ..sort((a, b) {
        if (a.deadline == null) return 1;
        if (b.deadline == null) return -1;
        return a.deadline!.compareTo(b.deadline!);
      });
    return all.where((stage) {
      return switch (_filter) {
        _AgendaFilter.upcoming => !stage.isDone && !stage.isOverdue,
        _AgendaFilter.overdue => stage.isOverdue,
        _AgendaFilter.done => stage.isDone,
        _AgendaFilter.all => true,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ResearchActivityProvider>();
    final academic = context.watch<AcademicWorkspaceProvider>();
    final role =
        (context.watch<AuthProvider>().currentUser?.type ?? '').toUpperCase();
    final items = _items(projects, academic);

    return Scaffold(
      appBar: AppBar(title: const Text('Agenda')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.page,
          children: [
            const AcademicPageHeader(
              eyebrow: 'Prazos reais',
              title: 'Agenda acadêmica',
              description:
                  'Etapas e datas dos seus projetos em uma única visão.',
            ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SegmentedButton<_AgendaFilter>(
                segments: const [
                  ButtonSegment(
                      value: _AgendaFilter.upcoming, label: Text('Próximos')),
                  ButtonSegment(
                      value: _AgendaFilter.overdue, label: Text('Atrasados')),
                  ButtonSegment(
                      value: _AgendaFilter.done, label: Text('Concluídos')),
                  ButtonSegment(value: _AgendaFilter.all, label: Text('Todos')),
                ],
                selected: {_filter},
                onSelectionChanged: (value) =>
                    setState(() => _filter = value.first),
              ),
            ),
            const SizedBox(height: 20),
            if (academic.isLoading && items.isEmpty)
              const AcademicSkeletonList()
            else if (academic.errorMessage != null && items.isEmpty)
              AcademicErrorState(
                message: academic.errorMessage!,
                onRetry: _load,
              )
            else if (items.isEmpty)
              const AcademicEmptyState(
                icon: Icons.event_available_outlined,
                title: 'Nenhum prazo nesta categoria',
                description:
                    'As datas definidas nas etapas dos projetos aparecerão aqui.',
              )
            else
              for (final stage in items) ...[
                _StageCard(
                  stage: stage,
                  canComplete: !stage.isDone &&
                      (stage.responsible == 'AMBOS' ||
                          stage.responsible == role),
                  busy: academic.isLoading,
                  onComplete: () => academic.completeStage(
                    stage.projectId,
                    stage.id,
                  ),
                ),
                const SizedBox(height: 12),
              ],
          ],
        ),
      ),
    );
  }
}

class _StageCard extends StatelessWidget {
  const _StageCard({
    required this.stage,
    required this.canComplete,
    required this.busy,
    required this.onComplete,
  });

  final ProjectStage stage;
  final bool canComplete;
  final bool busy;
  final Future<bool> Function() onComplete;

  @override
  Widget build(BuildContext context) {
    final date = stage.deadline == null
        ? 'Sem data definida'
        : '${stage.deadline!.day.toString().padLeft(2, '0')}/${stage.deadline!.month.toString().padLeft(2, '0')}/${stage.deadline!.year}';
    final status = stage.isDone
        ? 'DONE'
        : stage.isOverdue
            ? 'ATRASADA'
            : stage.status;
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
                      Text(stage.projectTitle ?? 'Projeto',
                          style: Theme.of(context).textTheme.labelMedium),
                      const SizedBox(height: 4),
                      Text(stage.title,
                          style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                AcademicStatusBadge(status),
              ],
            ),
            if (stage.description != null) ...[
              const SizedBox(height: 8),
              Text(stage.description!,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 16),
                const SizedBox(width: 6),
                Text(date),
                const Spacer(),
                Text('${stage.weight.toStringAsFixed(0)}%'),
              ],
            ),
            if (canComplete) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: busy ? null : onComplete,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Concluir etapa'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
