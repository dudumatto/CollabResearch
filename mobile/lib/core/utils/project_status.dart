import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

String formatProjectStatus(String value) {
  final normalized = value.trim().toUpperCase();
  return switch (normalized) {
    'PENDENTE_ORIENTADOR' => 'Aguardando orientador',
    'ABERTO' => 'Aberto',
    'EM_ANDAMENTO' => 'Em andamento',
    'FINALIZADO' => 'Finalizado',
    'REJEITADO_ORIENTADOR' => 'Recusado pelo orientador',
    _ => value.isEmpty ? '-' : value,
  };
}

/// Situacao do projeto traduzida para a mesma escala de severidade que
/// NotificationPresentation usa, para o app ter uma regra de cor so.
///
/// Antes quase tudo era verde: ABERTO usava success (#2E8B57) e EM_ANDAMENTO
/// usava primary (#1F7A5A) -- dois tons vizinhos, indistinguiveis num selo
/// pequeno. FINALIZADO usava accent, que tambem e esverdeado, e
/// PENDENTE_ORIENTADOR nem aparecia nas condicoes: caia no retorno padrao e
/// ficava identico a EM_ANDAMENTO, dois estados bem diferentes com a mesma
/// cor. Agora cada situacao tem uma matiz propria, e a matiz diz o que
/// esperar dela.
enum ProjectStatusSeverity {
  /// Aceitando inscricoes: informativo, ninguem precisa agir.
  open,

  /// Trabalho corrente, o estado saudavel do projeto.
  active,

  /// Depende de uma acao de outra pessoa.
  waiting,

  /// Encerrado: nao pede mais atencao, entao recua visualmente.
  done,

  /// Recusado.
  refused,
}

ProjectStatusSeverity projectStatusSeverity(String value) {
  final normalized = value.trim().toUpperCase();

  if (normalized.contains('REJEITADO') || normalized.contains('RECUSADO')) {
    return ProjectStatusSeverity.refused;
  }
  if (normalized == 'FINALIZADO' || normalized.contains('CONCLUID')) {
    return ProjectStatusSeverity.done;
  }
  if (normalized.contains('PENDENTE') || normalized.contains('AGUARDANDO')) {
    return ProjectStatusSeverity.waiting;
  }
  if (normalized == 'EM_ANDAMENTO' || normalized.contains('ANDAMENTO')) {
    return ProjectStatusSeverity.active;
  }
  if (normalized == 'ABERTO' || normalized.contains('ATIVO')) {
    return ProjectStatusSeverity.open;
  }
  return ProjectStatusSeverity.active;
}

Color projectStatusColor(BuildContext context, String value) {
  final isLight = Theme.of(context).brightness == Brightness.light;

  return switch (projectStatusSeverity(value)) {
    // Turquesa: proximo da marca sem se confundir com o verde do andamento.
    ProjectStatusSeverity.open =>
      isLight ? AppColors.accent : AppColors.darkAccent,
    ProjectStatusSeverity.active =>
      isLight ? AppColors.primary : AppColors.darkPrimary,
    ProjectStatusSeverity.waiting =>
      isLight ? AppColors.warning : AppColors.darkWarning,
    ProjectStatusSeverity.done =>
      isLight ? AppColors.muted : AppColors.darkMuted,
    ProjectStatusSeverity.refused =>
      isLight ? AppColors.danger : AppColors.darkDanger,
  };
}

int estimatedProjectProgress(String value) {
  final normalized = value.trim().toUpperCase();
  return switch (normalized) {
    'FINALIZADO' => 100,
    'EM_ANDAMENTO' => 50,
    'ABERTO' => 10,
    'PENDENTE_ORIENTADOR' => 0,
    _ => 0,
  };
}
