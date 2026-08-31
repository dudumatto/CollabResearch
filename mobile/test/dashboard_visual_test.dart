import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/theme/app_colors.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/widgets/dashboard/project_status_chart.dart';
import 'package:tcc_mobile/widgets/dashboard/stats_card.dart';

Project _project(String status) => Project(
      id: status,
      title: 'Projeto',
      area: 'TI',
      course: 'ADS',
      status: status,
    );

Widget _wrap(Widget child) => MaterialApp(
      theme: AppTheme.lightTheme,
      home: Scaffold(body: SingleChildScrollView(child: child)),
    );

void main() {
  group('StatsCard', () {
    testWidgets('usa a cor recebida no chip do icone', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const StatsCard(
            title: 'Pendentes',
            value: '4',
            icon: Icons.pending_actions_outlined,
            color: AppColors.chartAmber,
          ),
        ),
      );

      final container = tester.widget<Container>(
        find
            .descendant(
              of: find.byType(StatsCard),
              matching: find.byType(Container),
            )
            .first,
      );
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, AppColors.chartAmber);
      expect(find.text('4'), findsOneWidget);
      expect(find.text('Pendentes'), findsOneWidget);
    });

    testWidgets('sem cor informada cai no primario do tema', (tester) async {
      await tester.pumpWidget(
        _wrap(const StatsCard(title: 'Projetos', value: '3')),
      );

      final container = tester.widget<Container>(
        find
            .descendant(
              of: find.byType(StatsCard),
              matching: find.byType(Container),
            )
            .first,
      );
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.color, AppColors.primary);
    });
  });

  group('buildProjectStatusSlices', () {
    test('agrupa status marginais em Outros', () {
      final slices = buildProjectStatusSlices(
        [
          _project('ABERTO'),
          _project('EM_ANDAMENTO'),
          _project('FINALIZADO'),
          _project('PENDENTE_ORIENTADOR'),
          _project('REJEITADO_ORIENTADOR'),
        ],
        isDark: false,
      );

      expect(slices.length, 4);
      expect(
        slices.firstWhere((s) => s.label == 'Outros').count,
        2,
        reason: 'pendente e rejeitado nao viram series proprias',
      );
      expect(slices.firstWhere((s) => s.label == 'Abertos').count, 1);
      expect(slices.firstWhere((s) => s.label == 'Em andamento').count, 1);
      expect(slices.firstWhere((s) => s.label == 'Finalizados').count, 1);
    });

    test('sem status marginais nao cria a faixa Outros', () {
      final slices = buildProjectStatusSlices(
        [_project('ABERTO'), _project('FINALIZADO')],
        isDark: false,
      );

      expect(slices.length, 3);
      expect(slices.any((s) => s.label == 'Outros'), isFalse);
    });

    test('tema escuro usa degraus proprios, nao os claros', () {
      final light = buildProjectStatusSlices([_project('ABERTO')], isDark: false);
      final dark = buildProjectStatusSlices([_project('ABERTO')], isDark: true);

      expect(light.first.color, AppColors.chartGreen);
      expect(dark.first.color, AppColors.darkChartGreen);
      expect(light.first.color, isNot(dark.first.color));
    });
  });

  group('ProjectStatusChart', () {
    testWidgets('lista vazia mostra estado vazio, nao barra de valor zero',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const ProjectStatusChart(projects: [])),
      );

      expect(find.text('Sem projetos para exibir'), findsOneWidget);
      expect(find.text('Nenhum projeto vinculado ainda.'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('com dados mostra legenda nomeada com a contagem',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          ProjectStatusChart(
            projects: [
              _project('ABERTO'),
              _project('ABERTO'),
              _project('FINALIZADO'),
            ],
          ),
        ),
      );

      // Identidade nunca so por cor: a legenda traz o nome e a contagem.
      expect(find.text('Abertos · 2'), findsOneWidget);
      expect(find.text('Finalizados · 1'), findsOneWidget);
      expect(find.text('3 no total, por situação.'), findsOneWidget);
    });
  });

  group('responsividade do painel', () {
    for (final width in <double>[320, 360, 375, 390, 412, 430]) {
      testWidgets('grafico e cartao nao transbordam em $width px',
          (tester) async {
        await tester.binding.setSurfaceSize(Size(width, 820));
        addTearDown(() => tester.binding.setSurfaceSize(null));

        await tester.pumpWidget(
          _wrap(
            Column(
              children: [
                const StatsCard(
                  title: 'Etapas atrasadas',
                  value: '12',
                  icon: Icons.event_busy_outlined,
                  color: AppColors.danger,
                ),
                ProjectStatusChart(
                  projects: [
                    _project('ABERTO'),
                    _project('EM_ANDAMENTO'),
                    _project('FINALIZADO'),
                    _project('PENDENTE_ORIENTADOR'),
                  ],
                ),
              ],
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 500));

        expect(tester.takeException(), isNull);
      });
    }
  });
}
