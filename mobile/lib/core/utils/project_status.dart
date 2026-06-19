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

Color projectStatusColor(String value) {
  final normalized = value.trim().toUpperCase();
  if (normalized == 'FINALIZADO' || normalized.contains('REJEITADO')) {
    return AppColors.danger;
  }
  if (normalized == 'EM_ANDAMENTO') {
    return AppColors.warning;
  }
  if (normalized == 'ABERTO' || normalized.contains('ATIVO')) {
    return AppColors.success;
  }
  return AppColors.primary;
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
