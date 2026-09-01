import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/animation/app_animations.dart';
import '../../core/animation/app_durations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/date_utils.dart';
import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/research_activity_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/agenda/agenda_urgency.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_section_header.dart';
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
    return selectedProjects
        .expand((project) => academic.stagesFor(project.id))
        .toList()
      ..sort((a, b) {
        if (a.deadline == null) return 1;
        if (b.deadline == null) return -1;
        return a.deadline!.compareTo(b.deadline!);
      });
  }

  bool _matchesFilter(ProjectStage stage, _AgendaFilter filter) {
    return switch (filter) {
      _AgendaFilter.upcoming => !stage.isDone && !stage.isOverdue,
      _AgendaFilter.overdue => stage.isOverdue,
      _AgendaFilter.done => stage.isDone,
      _AgendaFilter.all => true,
    };
  }

  List<ProjectStage> _items(List<ProjectStage> all) {
    // Um dia selecionado manda sozinho: ver "o que vence neste dia" não deve
    // depender do filtro que estava ativo antes.
    if (_selectedDate != null) {
      return all
          .where((stage) => DateUtilsX.isSameDay(stage.deadline, _selectedDate))
          .toList();
    }
    return all.where((stage) => _matchesFilter(stage, _filter)).toList();
  }

  void _selectDate(DateTime? date) {
    setState(() {
      _selectedDate = DateUtilsX.isSameDay(date, _selectedDate) ? null : date;
      // Tocar num dia limpa o filtro, senão o marcador aceso no calendário
      // convivia com uma lista vazia embaixo.
      if (_selectedDate != null) _filter = _AgendaFilter.all;
    });
  }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ResearchActivityProvider>();
    final academic = context.watch<AcademicWorkspaceProvider>();
    final user = context.watch<AuthProvider>().currentUser;
    final role = (user?.type ?? user?.roles.firstOrNull ?? '').toUpperCase();
    final allItems = _allItems(projects, academic);
    final items = _items(allItems);

    // A Agenda e aba do menu inferior E tela empurrada a partir do detalhe do
    // projeto. Como aba nao ha para onde voltar; empurrada, ficava sem
    // nenhuma saida de volta ao projeto.
    // Navigator.canPop em vez de context.canPop() do go_router: o segundo
    // exige um GoRouter no contexto e quebraria a tela montada isolada.
    final canGoBack = Navigator.canPop(context);

    return Scaffold(
      // Sem AppBar: o cartao de destaque ja carrega o titulo, e quando ha para
      // onde voltar o proprio cabecalho exibe o botao. SafeArea assume o
      // recuo da status bar que o AppBar dava.
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _load,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final horizontal = constraints.maxWidth > AppBreakpoints.medium
                  ? (constraints.maxWidth - 720) / 2
                  : AppSpacing.page.left;
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(
                  horizontal,
                  AppSpacing.lg,
                  horizontal,
                  AppSpacing.xxl + MediaQuery.paddingOf(context).bottom,
                ),
                children: [
                  AppPageHeader(
                    compact: true,
                    eyebrow: 'Prazos reais',
                    title: widget.projectId == null
                        ? 'Agenda acadêmica'
                        : 'Agenda do projeto',
                    description: widget.projectId == null
                        ? 'Etapas e datas dos seus projetos em uma única visão.'
                        : 'Etapas e datas deste projeto.',
                    onBack: canGoBack ? () => context.pop() : null,
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
                    onToday: () {
                      final now = DateTime.now();
                      setState(() {
                        _visibleMonth = DateTime(now.year, now.month);
                      });
                      _selectDate(DateTime(now.year, now.month, now.day));
                    },
                    onSelectDate: _selectDate,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  if (_selectedDate == null)
                    _FilterBar(
                      filter: _filter,
                      counts: {
                        for (final value in _AgendaFilter.values)
                          value: allItems
                              .where((stage) => _matchesFilter(stage, value))
                              .length,
                      },
                      onChanged: (value) => setState(() => _filter = value),
                    )
                  else
                    _SelectedDayHeader(
                      date: _selectedDate!,
                      stages: items,
                      onClear: () => setState(() => _selectedDate = null),
                    ),
                  const SizedBox(height: AppSpacing.lg),
                  if (academic.isLoading && items.isEmpty)
                    const AcademicSkeletonList()
                  else if (academic.errorMessage != null && items.isEmpty)
                    AcademicErrorState(
                      message: academic.errorMessage!,
                      onRetry: _load,
                    )
                  else if (items.isEmpty)
                    _EmptyAgenda(
                      hasAnyStage: allItems.isNotEmpty,
                      selectedDate: _selectedDate,
                      filter: _filter,
                      onClearDate: () => setState(() => _selectedDate = null),
                    )
                  else
                    ..._buildList(items, academic, role),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  /// Com um dia selecionado a lista já é um grupo só. Sem dia, agrupa por
  /// urgência, o que coloca o que está pegando fogo no topo.
  List<Widget> _buildList(
    List<ProjectStage> items,
    AcademicWorkspaceProvider academic,
    String role,
  ) {
    Widget card(ProjectStage stage, int index) => StaggeredFadeSlideIn(
          index: index,
          child: Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: _StageCard(
              stage: stage,
              canComplete: !stage.isDone &&
                  (stage.responsible == 'AMBOS' || stage.responsible == role),
              busy: academic.isLoading,
              onComplete: () => _completeStage(academic, stage),
            ),
          ),
        );

    if (_selectedDate != null) {
      return [
        for (var index = 0; index < items.length; index++)
          card(items[index], index),
      ];
    }

    final groups = <StageUrgency, List<ProjectStage>>{};
    for (final stage in items) {
      groups.putIfAbsent(stageUrgency(stage), () => []).add(stage);
    }

    final widgets = <Widget>[];
    var index = 0;
    for (final urgency in StageUrgency.values) {
      final group = groups[urgency];
      if (group == null || group.isEmpty) continue;
      widgets.add(
        Padding(
          padding: EdgeInsets.only(
            top: widgets.isEmpty ? 0 : AppSpacing.sm,
            bottom: AppSpacing.md,
          ),
          child: AppSectionHeader(
            title: urgencyGroupLabel(urgency),
            subtitle: group.length == 1 ? '1 etapa' : '${group.length} etapas',
          ),
        ),
      );
      for (final stage in group) {
        widgets.add(card(stage, index));
        index++;
      }
    }
    return widgets;
  }
}

/// Cabeçalho grande do dia escolhido. Era só `'Prazos de 14/09/2026'` em
/// labelLarge; a data agora é o maior elemento da seção.
class _SelectedDayHeader extends StatelessWidget {
  const _SelectedDayHeader({
    required this.date,
    required this.stages,
    required this.onClear,
  });

  final DateTime date;
  final List<ProjectStage> stages;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final overdue = stages.where((stage) => stage.isOverdue).length;
    final parts = <String>[
      DateUtilsX.weekdayName(date.weekday),
      stages.length == 1 ? '1 prazo' : '${stages.length} prazos',
      if (overdue > 0) overdue == 1 ? '1 atrasado' : '$overdue atrasados',
    ];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                DateUtilsX.longDate(date),
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                parts.join(' · '),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        TextButton(
          onPressed: onClear,
          style: TextButton.styleFrom(minimumSize: const Size(64, 44)),
          child: const Text('Mostrar todos'),
        ),
      ],
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.filter,
    required this.counts,
    required this.onChanged,
  });

  final _AgendaFilter filter;
  final Map<_AgendaFilter, int> counts;
  final ValueChanged<_AgendaFilter> onChanged;

  static const Map<_AgendaFilter, String> _labels = {
    _AgendaFilter.upcoming: 'Próximos',
    _AgendaFilter.overdue: 'Atrasados',
    _AgendaFilter.done: 'Concluídos',
    _AgendaFilter.all: 'Todos',
  };

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SegmentedButton<_AgendaFilter>(
        segments: [
          for (final entry in _labels.entries)
            ButtonSegment(
              value: entry.key,
              // A contagem no rótulo é metade da resposta para "não sei
              // quantas tarefas tem".
              label: Text('${entry.value} ${counts[entry.key] ?? 0}'),
            ),
        ],
        selected: {filter},
        showSelectedIcon: false,
        onSelectionChanged: (value) => onChanged(value.first),
      ),
    );
  }
}

/// Três situações que antes dividiam a mesma mensagem genérica.
class _EmptyAgenda extends StatelessWidget {
  const _EmptyAgenda({
    required this.hasAnyStage,
    required this.selectedDate,
    required this.filter,
    required this.onClearDate,
  });

  final bool hasAnyStage;
  final DateTime? selectedDate;
  final _AgendaFilter filter;
  final VoidCallback onClearDate;

  @override
  Widget build(BuildContext context) {
    if (selectedDate != null) {
      return Column(
        children: [
          AcademicEmptyState(
            icon: Icons.event_available_outlined,
            title: '0 prazos em ${DateUtilsX.longDate(selectedDate!)}',
            description: 'Nenhuma etapa dos seus projetos vence neste dia.',
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: onClearDate,
            style: TextButton.styleFrom(minimumSize: const Size(64, 44)),
            child: const Text('Mostrar todos os prazos'),
          ),
        ],
      );
    }

    if (!hasAnyStage) {
      return const AcademicEmptyState(
        icon: Icons.event_note_outlined,
        title: 'Nenhuma etapa com prazo',
        description: 'Quando o orientador definir datas para as etapas dos '
            'seus projetos, elas aparecem neste calendário.',
      );
    }

    return switch (filter) {
      _AgendaFilter.overdue => const AcademicEmptyState(
          icon: Icons.verified_outlined,
          title: 'Nada atrasado',
          description: 'Todas as etapas com prazo estão em dia.',
        ),
      _AgendaFilter.done => const AcademicEmptyState(
          icon: Icons.task_alt_outlined,
          title: 'Nenhuma etapa concluída ainda',
          description:
              'As etapas que você marcar como concluídas ficam registradas aqui.',
        ),
      _ => const AcademicEmptyState(
          icon: Icons.event_available_outlined,
          title: 'Sem prazos à frente',
          description: 'Não há etapas pendentes com data futura.',
        ),
    };
  }
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

  static const List<String> _weekdayLetters = [
    'S',
    'T',
    'Q',
    'Q',
    'S',
    'S',
    'D'
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final first = DateTime(visibleMonth.year, visibleMonth.month);
    final daysInMonth =
        DateTime(visibleMonth.year, visibleMonth.month + 1, 0).day;
    final leading = first.weekday - 1;
    final cellCount = leading + daysInMonth;
    final rows = (cellCount / 7).ceil();
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final dayExtent = textScale > 1.25 ? 62.0 : 48.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.lg,
        ),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: theme.textTheme.headlineSmall,
                      children: [
                        TextSpan(
                          text: DateUtilsX.monthName(visibleMonth.month),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        TextSpan(
                          text: ' ${visibleMonth.year}',
                          style: TextStyle(
                            fontWeight: FontWeight.w400,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                TextButton(
                  onPressed: onToday,
                  style: TextButton.styleFrom(minimumSize: const Size(48, 44)),
                  child: const Text('Hoje'),
                ),
                IconButton(
                  onPressed: onPreviousMonth,
                  tooltip: 'Mês anterior',
                  icon: const Icon(Icons.chevron_left),
                ),
                IconButton(
                  onPressed: onNextMonth,
                  tooltip: 'Próximo mês',
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                for (var index = 0; index < 7; index++)
                  Expanded(
                    child: Semantics(
                      label: DateUtilsX.weekdayName(index + 1),
                      excludeSemantics: true,
                      child: Center(
                        child: Text(
                          _weekdayLetters[index],
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: AppColors.mutedSoft,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            AnimatedSwitcher(
              duration: MediaQuery.disableAnimationsOf(context)
                  ? Duration.zero
                  : AppDurations.fast,
              child: GridView.builder(
                key: ValueKey('${visibleMonth.year}-${visibleMonth.month}'),
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  mainAxisExtent: dayExtent,
                ),
                itemCount: rows * 7,
                itemBuilder: (context, index) {
                  final dayNumber = index - leading + 1;
                  final inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
                  final date = DateTime(
                    visibleMonth.year,
                    visibleMonth.month,
                    dayNumber,
                  );
                  final dayStages = inMonth
                      ? stages
                          .where(
                            (stage) =>
                                DateUtilsX.isSameDay(stage.deadline, date),
                          )
                          .toList()
                      : const <ProjectStage>[];

                  return _CalendarDay(
                    date: date,
                    inMonth: inMonth,
                    stages: dayStages,
                    selected: DateUtilsX.isSameDay(date, selectedDate),
                    isToday: DateUtilsX.isSameDay(date, DateTime.now()),
                    onTap: inMonth ? () => onSelectDate(date) : null,
                  );
                },
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            const _CalendarLegend(),
          ],
        ),
      ),
    );
  }
}

class _CalendarDay extends StatelessWidget {
  const _CalendarDay({
    required this.date,
    required this.inMonth,
    required this.stages,
    required this.selected,
    required this.isToday,
    required this.onTap,
  });

  final DateTime date;
  final bool inMonth;
  final List<ProjectStage> stages;
  final bool selected;
  final bool isToday;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (!inMonth) {
      // Dias vizinhos esmaecidos mantêm o ritmo da grade nas bordas do mês.
      return Center(
        child: Text(
          '${date.day}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.35),
          ),
        ),
      );
    }

    final count = stages.length;
    final urgency = worstUrgency(stages);
    final accent = urgencyColor(context, urgency);
    final hasStages = count > 0;

    final background = selected
        ? colorScheme.primary
        : hasStages
            ? Color.lerp(colorScheme.surface, accent, 0.12)
            : Colors.transparent;

    return Semantics(
      button: onTap != null,
      selected: selected,
      label: _semanticsLabel(count, urgency),
      excludeSemantics: true,
      child: Center(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: AnimatedContainer(
              duration: MediaQuery.disableAnimationsOf(context)
                  ? Duration.zero
                  : AppDurations.fast,
              curve: AppCurves.standard,
              width: 38,
              height: 44,
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: isToday && !selected
                    ? Border.all(color: colorScheme.primary, width: 1.5)
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${date.day}',
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.1,
                      fontWeight: selected || isToday
                          ? FontWeight.w800
                          : FontWeight.w600,
                      color: selected
                          ? colorScheme.onPrimary
                          : isToday
                              ? colorScheme.primary
                              : colorScheme.onSurface,
                    ),
                  ),
                  if (hasStages) ...[
                    const SizedBox(height: 2),
                    _CountChip(
                      key: ValueKey(
                        'agenda-day-count-${date.year}-${date.month}-${date.day}',
                      ),
                      count: count,
                      color: accent,
                      onSelectedDay: selected,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _semanticsLabel(int count, StageUrgency urgency) {
    final day =
        '${DateUtilsX.weekdayName(date.weekday)}, ${DateUtilsX.longDate(date)}';
    if (count == 0) return '$day. Sem prazos.';
    final plural = count == 1 ? '1 prazo' : '$count prazos';
    return '$day. $plural. ${urgencyGroupLabel(urgency)}.';
  }
}

/// O número, não um ponto. Um ponto de 4px não responde "quantas tarefas tem".
class _CountChip extends StatelessWidget {
  const _CountChip({
    super.key,
    required this.count,
    required this.color,
    required this.onSelectedDay,
  });

  final int count;
  final Color color;
  final bool onSelectedDay;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    // No dia selecionado o fundo já é verde cheio, então o chip inverte para
    // continuar legível.
    final background = onSelectedDay ? colorScheme.onPrimary : color;
    final foreground = onSelectedDay ? color : Colors.white;

    return Container(
      height: 15,
      constraints: const BoxConstraints(minWidth: 15),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        // Teto em 9+: dois glifos no máximo cabem nos 38px da célula mesmo
        // numa tela de 320px. O número exato aparece no cabeçalho do dia.
        count > 9 ? '9+' : '$count',
        style: TextStyle(
          color: foreground,
          fontSize: 10,
          height: 1,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _CalendarLegend extends StatelessWidget {
  const _CalendarLegend();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: AppSpacing.md,
      runSpacing: AppSpacing.sm,
      children: [
        for (final urgency in const [
          StageUrgency.overdue,
          StageUrgency.today,
          StageUrgency.thisWeek,
          StageUrgency.done,
        ])
          _LegendDot(
            color: urgencyColor(context, urgency),
            label: switch (urgency) {
              StageUrgency.overdue => 'Atrasado',
              StageUrgency.today => 'Vence hoje',
              StageUrgency.thisWeek => 'Esta semana',
              _ => 'Concluído',
            },
          ),
      ],
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
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: AppSpacing.xs),
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final urgency = stageUrgency(stage);
    final accent = urgencyColor(context, urgency);
    final status = stage.isDone
        ? 'DONE'
        : stage.isOverdue
            ? 'ATRASADA'
            : stage.status;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // A data vira o elemento mais forte do card e carrega a cor
                // da urgência. Antes era texto de corpo no rodapé.
                SizedBox(
                  width: 44,
                  child: Column(
                    children: [
                      Text(
                        stage.deadline == null ? '—' : '${stage.deadline!.day}',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: accent,
                          height: 1.05,
                        ),
                      ),
                      Text(
                        stage.deadline == null
                            ? 'SEM DATA'
                            : DateUtilsX.monthAbbrev(stage.deadline!.month),
                        textAlign: TextAlign.center,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (stage.projectTitle != null)
                        Text(
                          stage.projectTitle!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      Text(
                        stage.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      // A urgência dita em palavras, não só em cor.
                      Text(
                        urgencyLabel(stage),
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: accent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                AcademicStatusBadge(status),
              ],
            ),
            if (stage.description != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                stage.description!,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (stage.weight > 0) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Peso ${stage.weight.toStringAsFixed(0)}%',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (canComplete) ...[
              const SizedBox(height: AppSpacing.md),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: busy ? null : onComplete,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(64, 44),
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 18),
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
