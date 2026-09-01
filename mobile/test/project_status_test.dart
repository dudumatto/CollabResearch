import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_colors.dart';
import 'package:tcc_mobile/core/utils/project_status.dart';

const _statuses = [
  'ABERTO',
  'EM_ANDAMENTO',
  'PENDENTE_ORIENTADOR',
  'FINALIZADO',
  'REJEITADO_ORIENTADOR',
];

/// Resolve as cores de todos os status num tema real, porque a cor depende do
/// brilho do tema.
Future<Map<String, Color>> _colorsFor(
  WidgetTester tester,
  Brightness brightness,
) async {
  final resolved = <String, Color>{};

  await tester.pumpWidget(
    MaterialApp(
      theme: ThemeData(brightness: brightness),
      home: Builder(
        builder: (context) {
          for (final status in _statuses) {
            resolved[status] = projectStatusColor(context, status);
          }
          return const SizedBox();
        },
      ),
    ),
  );

  return resolved;
}

void main() {
  test('formata status de projeto do backend para exibicao', () {
    expect(formatProjectStatus('EM_ANDAMENTO'), 'Em andamento');
    expect(formatProjectStatus('FINALIZADO'), 'Finalizado');
    expect(formatProjectStatus('ABERTO'), 'Aberto');
  });

  test('progresso estimado por status', () {
    expect(estimatedProjectProgress('EM_ANDAMENTO'), 50);
    expect(estimatedProjectProgress('FINALIZADO'), 100);
  });

  test('cada situacao tem uma severidade propria', () {
    expect(projectStatusSeverity('ABERTO'), ProjectStatusSeverity.open);
    expect(projectStatusSeverity('EM_ANDAMENTO'), ProjectStatusSeverity.active);
    expect(
      projectStatusSeverity('PENDENTE_ORIENTADOR'),
      ProjectStatusSeverity.waiting,
    );
    expect(projectStatusSeverity('FINALIZADO'), ProjectStatusSeverity.done);
    expect(
      projectStatusSeverity('REJEITADO_ORIENTADOR'),
      ProjectStatusSeverity.refused,
    );
  });

  testWidgets('nenhuma situacao repete a cor de outra', (tester) async {
    // O motivo da mudanca: ABERTO e EM_ANDAMENTO eram dois verdes vizinhos e
    // PENDENTE_ORIENTADOR caia no padrao, ficando igual a EM_ANDAMENTO.
    for (final brightness in Brightness.values) {
      final colors = await _colorsFor(tester, brightness);

      expect(
        colors.values.toSet(),
        hasLength(_statuses.length),
        reason: 'cores repetidas no tema $brightness: $colors',
      );
    }
  });

  testWidgets('aberto e em andamento nao sao o mesmo verde', (tester) async {
    final colors = await _colorsFor(tester, Brightness.light);

    expect(colors['ABERTO'], AppColors.accent);
    expect(colors['EM_ANDAMENTO'], AppColors.primary);
    expect(colors['ABERTO'], isNot(colors['EM_ANDAMENTO']));
  });

  testWidgets('quem espera acao usa alerta e quem foi recusado usa erro',
      (tester) async {
    final colors = await _colorsFor(tester, Brightness.light);

    expect(colors['PENDENTE_ORIENTADOR'], AppColors.warning);
    expect(colors['REJEITADO_ORIENTADOR'], AppColors.danger);
  });

  testWidgets('projeto encerrado recua em vez de competir por atencao',
      (tester) async {
    final colors = await _colorsFor(tester, Brightness.light);

    expect(colors['FINALIZADO'], AppColors.muted);
  });

  testWidgets('o tema escuro usa as variantes escuras', (tester) async {
    final colors = await _colorsFor(tester, Brightness.dark);

    expect(colors['ABERTO'], AppColors.darkAccent);
    expect(colors['EM_ANDAMENTO'], AppColors.darkPrimary);
    expect(colors['PENDENTE_ORIENTADOR'], AppColors.darkWarning);
    expect(colors['REJEITADO_ORIENTADOR'], AppColors.darkDanger);
  });
}
