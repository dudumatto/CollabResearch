import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/theme/app_colors.dart';
import 'package:tcc_mobile/models/academic_workspace.dart';
import 'package:tcc_mobile/widgets/agenda/agenda_urgency.dart';

ProjectStage _stage({int? inDays, bool done = false}) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return ProjectStage(
    id: '1',
    projectId: '4',
    title: 'Etapa',
    status: done ? 'DONE' : 'ACTIVE',
    deadline: inDays == null ? null : today.add(Duration(days: inDays)),
  );
}

void main() {
  group('stageUrgency', () {
    test('atrasada quando o prazo ja passou', () {
      expect(stageUrgency(_stage(inDays: -1)), StageUrgency.overdue);
      expect(stageUrgency(_stage(inDays: -30)), StageUrgency.overdue);
    });

    test('hoje e amanha sao faixas proprias', () {
      expect(stageUrgency(_stage(inDays: 0)), StageUrgency.today);
      expect(stageUrgency(_stage(inDays: 1)), StageUrgency.tomorrow);
    });

    test('ate sete dias e esta semana; depois disso e mais adiante', () {
      expect(stageUrgency(_stage(inDays: 2)), StageUrgency.thisWeek);
      expect(stageUrgency(_stage(inDays: 7)), StageUrgency.thisWeek);
      expect(stageUrgency(_stage(inDays: 8)), StageUrgency.later);
    });

    test('sem prazo', () {
      expect(stageUrgency(_stage()), StageUrgency.none);
    });

    test('concluida vence qualquer prazo, inclusive vencido', () {
      expect(stageUrgency(_stage(inDays: -5, done: true)), StageUrgency.done);
    });
  });

  group('worstUrgency', () {
    test('o dia assume a pior etapa que tem nele', () {
      final urgency = worstUrgency([
        _stage(inDays: 5, done: true),
        _stage(inDays: 3),
        _stage(inDays: -2),
      ]);
      expect(urgency, StageUrgency.overdue);
    });

    test('sem nada atrasado, hoje ganha da semana', () {
      expect(
        worstUrgency([_stage(inDays: 4), _stage(inDays: 0)]),
        StageUrgency.today,
      );
    });

    test('so concluidas resulta em concluido', () {
      expect(
        worstUrgency([_stage(inDays: -3, done: true)]),
        StageUrgency.done,
      );
    });

    test('lista vazia nao explode', () {
      expect(worstUrgency(const []), StageUrgency.none);
    });
  });

  group('urgencyLabel', () {
    test('diz a urgencia em palavras, nao so em cor', () {
      expect(urgencyLabel(_stage(inDays: 0)), 'Vence hoje');
      expect(urgencyLabel(_stage(inDays: 1)), 'Vence amanhã');
      expect(urgencyLabel(_stage(inDays: -1)), 'Atrasada há 1 dia');
      expect(urgencyLabel(_stage(inDays: -4)), 'Atrasada há 4 dias');
      expect(urgencyLabel(_stage(inDays: 5)), 'Em 5 dias');
      expect(urgencyLabel(_stage()), 'Sem data definida');
      expect(urgencyLabel(_stage(inDays: 2, done: true)), 'Concluída');
    });
  });

  testWidgets('atrasado e vermelho e vence hoje e laranja', (tester) async {
    late Color overdue;
    late Color today;
    late Color done;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) {
            overdue = urgencyColor(context, StageUrgency.overdue);
            today = urgencyColor(context, StageUrgency.today);
            done = urgencyColor(context, StageUrgency.done);
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    expect(overdue, AppColors.danger);
    expect(today, AppColors.warning);
    expect(done, AppColors.success);
    // A distincao entre "ja perdi o prazo" e "vence hoje" e o ponto todo.
    expect(overdue, isNot(today));
  });

  testWidgets('as cores mudam no tema escuro', (tester) async {
    late Color light;
    late Color dark;

    await tester.pumpWidget(
      MaterialApp(
        home: Column(
          children: [
            Theme(
              data: ThemeData(brightness: Brightness.light),
              child: Builder(
                builder: (context) {
                  light = urgencyColor(context, StageUrgency.overdue);
                  return const SizedBox.shrink();
                },
              ),
            ),
            Theme(
              data: ThemeData(brightness: Brightness.dark),
              child: Builder(
                builder: (context) {
                  dark = urgencyColor(context, StageUrgency.overdue);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );

    expect(light, AppColors.danger);
    expect(dark, AppColors.darkDanger);
  });
}
