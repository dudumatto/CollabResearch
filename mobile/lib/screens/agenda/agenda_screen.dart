import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_colors.dart';
import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_snackbar.dart';

enum _AgendaFilter { upcoming, overdue, done, all }

class AgendaScreen extends StatefulWidget {
  const AgendaScreen({super.key, this.projectId});

  final String? projectId;

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> {
  _AgendaFilter _filter = _AgendaFilter.upcoming;
  DateTime _visibleMonth = DateTime(DateTime.now().year, DateTime.now().month);
  DateTime? _selectedDate;

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

  Future<bool> _completeStage(
    AcademicWorkspaceProvider academic,
    ProjectStage stage,
  ) async {
    final success = await academic.completeStage(stage.projectId, stage.id);
    if (!mounted) return success;
    if (success) {
      AppSnackbar.showSuccess(context, 'Etapa concluída.');
    } else {
      AppSnackbar.showError(
        context,
        academic.errorMessage ?? 'Não foi possível concluir a etapa.',
      );
    }
    return success;
  }

  List<ProjectStage> _allItems(
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
    return all;
  }

  List<ProjectStage> _items(
    ResearchActivityProvider projects,
    AcademicWorkspaceProvider academic,
  ) {
    final all = _allItems(projects, academic);
    return all.where((stage) {
      if (_selectedDate != null && !_sameDay(stage.deadline, _selectedDate)) {
        return false;
      }
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
    final user = context.watch<AuthProvider>().currentUser;
    final role = (user?.type ?? user?.roles.firstOrNull ?? '').toUpperCase();
    final allItems = _allItems(projects, academic);
    final items = _items(projects, academic);

    return Scaffold(
      appBar: AppBar(title: const Text('Agenda')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : AppSpacing.page.left;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(horizontal, 16, horizontal, 32),
              children: [
                const AcademicPageHeader(
                  eyebrow: 'Prazos reais',
                  title: 'Agenda acadêmica',
                  description:
                      'Etapas e datas dos seus projetos em uma única visão.',
                ),
                _MonthCalendar(
                  visibleMonth: _visibleMonth,
                  selectedDate: _selectedDate,
                  stages: allItems,
                  onPreviousMonth: () => setState(() {
                    _visibleMonth = DateTime(
                      _visibleMonth.year,
                      _visibleMonth.month - 1,
                    );
                    _selectedDate = null;
                  }),
                  onNextMonth: () => setState(() {
                    _visibleMonth = DateTime(
                      _visibleMonth.year,
                      _visibleMonth.month + 1,
                    );
                    _selectedDate = null;
                  }),
                  onToday: () => setState(() {
                    final now = DateTime.now();
                    _visibleMonth = DateTime(now.year, now.month);
                    _selectedDate = DateTime(now.year, now.month, now.day);
                  }),
                  onSelectDate: (date) => setState(() {
                    _selectedDate = _sameDay(date, _selectedDate) ? null : date;
                  }),
                ),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SegmentedButton<_AgendaFilter>(
                    segments: const [
                      ButtonSegment(
                          value: _AgendaFilter.upcoming,
                          label: Text('Próximos')),
                      ButtonSegment(
                          value: _AgendaFilter.overdue,
                          label: Text('Atrasados')),
                      ButtonSegment(
                          value: _AgendaFilter.done, label: Text('Concluídos')),
                      ButtonSegment(
                          value: _AgendaFilter.all, label: Text('Todos')),
                    ],
                    selected: {_filter},
                    onSelectionChanged: (value) =>
                        setState(() => _filter = value.first),
                  ),
                ),
                if (_selectedDate != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Prazos de ${_formatDate(_selectedDate!)}',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _selectedDate = null),
                        child: const Text('Mostrar todos'),
                      ),
                    ],
                  ),
                ],
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
                      onComplete: () => _completeStage(academic, stage),
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

bool _sameDay(DateTime? a, DateTime? b) {
  if (a == null || b == null) return false;
  final localA = a.toLocal();
  final localB = b.toLocal();
  return localA.year == localB.year &&
      localA.month == localB.month &&
      localA.day == localB.day;
}

String _formatDate(DateTime date) {
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

class _MonthCalendar extends StatelessWidget {
  const _MonthCalendar({
    required this.visibleMonth,
    required this.selectedDate,
    required this.stages,
    required this.onPreviousMonth,
    required this.onNextMonth,
    required this.onToday,
    required this.onSelectDate,
  });

  final DateTime visibleMonth;
  final DateTime? selectedDate;
  final List<ProjectStage> stages;
  final VoidCallback onPreviousMonth;
  final VoidCallback onNextMonth;
  final VoidCallback onToday;
  final ValueChanged<DateTime> onSelectDate;

  static const _months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  @override
  Widget build(BuildContext context) {
    final first = DateTime(visibleMonth.year, visibleMonth.month);
    final leading = first.weekday - 1;
    final totalDays =
        DateTime(visibleMonth.year, visibleMonth.month + 1, 0).day;
    final cellCount = ((leading + totalDays + 6) ~/ 7) * 7;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final dayExtent = textScale > 1.3 ? 56.0 : 48.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${_months[visibleMonth.month - 1]} ${visibleMonth.year}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                TextButton(onPressed: onToday, child: const Text('Hoje')),
                IconButton(
                  onPressed: onPreviousMonth,
                  icon: const Icon(Icons.chevron_left),
                  tooltip: 'Mês anterior',
                ),
                IconButton(
                  onPressed: onNextMonth,
                  icon: const Icon(Icons.chevron_right),
                  tooltip: 'Próximo mês',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                for (final label in ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'])
                  Expanded(
                    child: Center(
                      child: Text(
                        label,
                        style: const TextStyle(
                          color: AppColors.mutedSoft,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 5),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: cellCount,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                mainAxisExtent: dayExtent,
              ),
              itemBuilder: (context, index) {
                final day = index - leading + 1;
                if (day < 1 || day > totalDays) return const SizedBox.shrink();
                final date =
                    DateTime(visibleMonth.year, visibleMonth.month, day);
                final dayStages = stages
                    .where((stage) => _sameDay(stage.deadline, date))
                    .toList();
                return _CalendarDay(
                  date: date,
                  selected: _sameDay(date, selectedDate),
                  today: _sameDay(date, DateTime.now()),
                  stages: dayStages,
                  onTap: () => onSelectDate(date),
                );
              },
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: [
                _LegendDot(
                  color: Theme.of(context).colorScheme.primary,
                  label: 'Próximo',
                ),
                const _LegendDot(color: AppColors.danger, label: 'Atrasado'),
                const _LegendDot(color: AppColors.accent, label: 'Concluído'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CalendarDay extends StatelessWidget {
  const _CalendarDay({
    required this.date,
    required this.selected,
    required this.today,
    required this.stages,
    required this.onTap,
  });

  final DateTime date;
  final bool selected;
  final bool today;
  final List<ProjectStage> stages;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    Color? marker;
    if (stages.any((stage) => stage.isOverdue)) {
      marker = AppColors.danger;
    } else if (stages.any((stage) => stage.isDone)) {
      marker = AppColors.accent;
    } else if (stages.isNotEmpty) {
      marker = AppColors.primary;
    }

    return Semantics(
      button: true,
      selected: selected,
      label: '${date.day}/${date.month}/${date.year}',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(11),
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            width: 38,
            height: 42,
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(11),
              border: today && !selected
                  ? Border.all(color: AppColors.primary)
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${date.day}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: selected
                            ? Theme.of(context).colorScheme.onPrimary
                            : Theme.of(context).colorScheme.onSurface,
                        fontWeight: selected || today
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                ),
                if (marker != null)
                  Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: selected
                          ? Theme.of(context).colorScheme.onPrimary
                          : marker,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
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
