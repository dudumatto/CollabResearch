import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../models/academic_workspace.dart';

/// REGRA DE COR DA AGENDA:
/// a cor comunica **urgência**, nunca decoração. Vermelho é o que já passou,
/// laranja é o que vence agora, verde da marca é a semana, cinza é o que está
/// longe e verde de sucesso é o que já foi concluído.
/// `.rules/anti-ai-ui.md` trata "ícones multicoloridos sem regra" como
/// anti-padrão — por isso a regra fica escrita aqui.
enum StageUrgency { overdue, today, tomorrow, thisWeek, later, none, done }

/// Ordem de gravidade. Num dia com etapas misturadas, o dia assume a pior
/// delas: um dia com 1 atrasada e 3 concluídas é um dia vermelho.
const List<StageUrgency> _severityOrder = [
  StageUrgency.overdue,
  StageUrgency.today,
  StageUrgency.tomorrow,
  StageUrgency.thisWeek,
  StageUrgency.later,
  StageUrgency.none,
  StageUrgency.done,
];

StageUrgency stageUrgency(ProjectStage stage) {
  if (stage.isDone) return StageUrgency.done;
  final days = stage.daysUntilDeadline;
  if (days == null) return StageUrgency.none;
  if (days < 0) return StageUrgency.overdue;
  if (days == 0) return StageUrgency.today;
  if (days == 1) return StageUrgency.tomorrow;
  if (days <= 7) return StageUrgency.thisWeek;
  return StageUrgency.later;
}

/// A urgência que representa um conjunto de etapas — a mais grave delas.
StageUrgency worstUrgency(Iterable<ProjectStage> stages) {
  StageUrgency? worst;
  for (final stage in stages) {
    final urgency = stageUrgency(stage);
    if (worst == null ||
        _severityOrder.indexOf(urgency) < _severityOrder.indexOf(worst)) {
      worst = urgency;
    }
  }
  return worst ?? StageUrgency.none;
}

Color urgencyColor(BuildContext context, StageUrgency urgency) {
  final isLight = Theme.of(context).brightness == Brightness.light;
  return switch (urgency) {
    StageUrgency.overdue => isLight ? AppColors.danger : AppColors.darkDanger,
    StageUrgency.today ||
    StageUrgency.tomorrow =>
      isLight ? AppColors.warning : AppColors.darkWarning,
    StageUrgency.thisWeek => Theme.of(context).colorScheme.primary,
    StageUrgency.done => isLight ? AppColors.success : AppColors.darkPrimary,
    StageUrgency.later ||
    StageUrgency.none =>
      isLight ? AppColors.muted : AppColors.darkMuted,
  };
}

/// Texto curto para a linha sob o título do card. É a mesma informação da
/// cor, dita em palavras — cor sozinha não é acessível.
String urgencyLabel(ProjectStage stage) {
  final urgency = stageUrgency(stage);
  final days = stage.daysUntilDeadline;
  return switch (urgency) {
    StageUrgency.done => 'Concluída',
    StageUrgency.none => 'Sem data definida',
    StageUrgency.today => 'Vence hoje',
    StageUrgency.tomorrow => 'Vence amanhã',
    StageUrgency.overdue => switch (days!) {
        -1 => 'Atrasada há 1 dia',
        _ => 'Atrasada há ${-days} dias',
      },
    StageUrgency.thisWeek || StageUrgency.later => 'Em $days dias',
  };
}

/// Rótulo do agrupamento da lista.
String urgencyGroupLabel(StageUrgency urgency) {
  return switch (urgency) {
    StageUrgency.overdue => 'Atrasados',
    StageUrgency.today => 'Hoje',
    StageUrgency.tomorrow => 'Amanhã',
    StageUrgency.thisWeek => 'Esta semana',
    StageUrgency.later => 'Mais adiante',
    StageUrgency.none => 'Sem data',
    StageUrgency.done => 'Concluídos',
  };
}
