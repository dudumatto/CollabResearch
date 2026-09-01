import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/academic_workspace.dart';
import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/academic_workspace_provider.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/research_activity_provider.dart';
import 'package:tcc_mobile/screens/agenda/agenda_screen.dart';

class _FakeAuthProvider extends AuthProvider {
  _FakeAuthProvider() {
    currentUser = const User(
      id: '1',
      name: 'Ana',
      email: 'ana@example.com',
      type: 'ALUNO',
    );
    token = 'header.payload.signature';
  }

  @override
  Future<void> checkAuth() async {}
}

class _FakeProjectsProvider extends ResearchActivityProvider {
  _FakeProjectsProvider() {
    relatedProjects.add(
      const Project(
        id: '4',
        title: 'Pesquisa aplicada',
        area: 'Computação',
        course: 'Ciência da Computação',
        status: 'EM_ANDAMENTO',
      ),
    );
  }

  @override
  Future<void> loadRelatedProjects() async {}
}

class _FakeAcademicProvider extends AcademicWorkspaceProvider {
  _FakeAcademicProvider(this._stages);

  final List<ProjectStage> _stages;

  @override
  Future<void> loadAgenda(List<Project> projects) async {}

  @override
  List<ProjectStage> stagesFor(String projectId) => _stages;
}

/// Dia do mês corrente, para as contagens serem previsíveis.
DateTime _dayOfThisMonth(int day) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, day);
}

/// Mira o contador daquele dia, e não qualquer texto igual na grade: o número
/// do dia 3 e a contagem "3" colidiriam num find.text solto.
Finder _dayCount(DateTime date) => find.descendant(
      of: find.byKey(
        ValueKey('agenda-day-count-${date.year}-${date.month}-${date.day}'),
      ),
      matching: find.byType(Text),
    );

ProjectStage _stage({
  required String id,
  required DateTime? deadline,
  bool done = false,
}) {
  return ProjectStage(
    id: id,
    projectId: '4',
    title: 'Etapa $id',
    status: done ? 'DONE' : 'ACTIVE',
    deadline: deadline,
    projectTitle: 'Pesquisa aplicada',
  );
}

Future<void> _pumpAgenda(
  WidgetTester tester,
  List<ProjectStage> stages, {
  Size surfaceSize = const Size(390, 1400),
}) async {
  await tester.binding.setSurfaceSize(surfaceSize);
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => _FakeAuthProvider()),
        ChangeNotifierProvider<ResearchActivityProvider>(
          create: (_) => _FakeProjectsProvider(),
        ),
        ChangeNotifierProvider<AcademicWorkspaceProvider>(
          create: (_) => _FakeAcademicProvider(stages),
        ),
      ],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        home: const AgendaScreen(),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  testWidgets('dia com tres prazos mostra o numero 3', (tester) async {
    // Era exatamente isto que faltava: o codigo antigo calculava a contagem e
    // usava so isNotEmpty, entao 2 e 9 prazos ficavam identicos.
    final day = _dayOfThisMonth(14);
    await _pumpAgenda(tester, [
      _stage(id: '1', deadline: day),
      _stage(id: '2', deadline: day),
      _stage(id: '3', deadline: day),
    ]);

    expect(tester.widget<Text>(_dayCount(day)).data, '3');
  });

  testWidgets('dia com mais de nove prazos mostra 9+', (tester) async {
    final day = _dayOfThisMonth(10);
    await _pumpAgenda(tester, [
      for (var index = 0; index < 12; index++)
        _stage(id: '$index', deadline: day),
    ]);

    // O teto evita dois glifos virarem tres e estourarem a celula de 38px.
    expect(tester.widget<Text>(_dayCount(day)).data, '9+');
  });

  testWidgets('dia com um prazo mostra 1', (tester) async {
    final day = _dayOfThisMonth(7);
    await _pumpAgenda(tester, [_stage(id: '1', deadline: day)]);

    expect(tester.widget<Text>(_dayCount(day)).data, '1');
  });

  testWidgets('dia sem prazo nao ganha contador', (tester) async {
    final day = _dayOfThisMonth(7);
    await _pumpAgenda(tester, [_stage(id: '1', deadline: day)]);

    // O dia 7 tem contador, o 8 nao.
    expect(_dayCount(day), findsOneWidget);
    expect(_dayCount(_dayOfThisMonth(8)), findsNothing);
  });

  testWidgets('etapa sem data nao marca dia nenhum', (tester) async {
    await _pumpAgenda(tester, [_stage(id: '1', deadline: null)]);

    for (var day = 1; day <= 28; day++) {
      expect(_dayCount(_dayOfThisMonth(day)), findsNothing);
    }
  });

  testWidgets('a contagem tambem e falada para o leitor de tela',
      (tester) async {
    final day = _dayOfThisMonth(14);
    await _pumpAgenda(tester, [
      _stage(id: '1', deadline: day),
      _stage(id: '2', deadline: day),
    ]);

    final semantics = tester.widgetList<Semantics>(find.byType(Semantics));
    final labels = semantics
        .map((widget) => widget.properties.label ?? '')
        .where((label) => label.contains('prazos'))
        .toList();

    expect(labels.any((label) => label.contains('2 prazos')), isTrue);
  });

  testWidgets('os filtros mostram a contagem no rotulo', (tester) async {
    // Datas relativas a hoje: um dia fixo do mes poderia cair no passado e
    // mudar a contagem conforme a data em que o teste roda.
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    await _pumpAgenda(tester, [
      _stage(id: '1', deadline: today.add(const Duration(days: 5))),
      _stage(id: '2', deadline: today.subtract(const Duration(days: 10))),
      _stage(
        id: '3',
        deadline: today.subtract(const Duration(days: 20)),
        done: true,
      ),
    ]);

    expect(find.text('Próximos 1'), findsOneWidget);
    expect(find.text('Atrasados 1'), findsOneWidget);
    expect(find.text('Concluídos 1'), findsOneWidget);
    expect(find.text('Todos 3'), findsOneWidget);
  });

  testWidgets('sem nenhuma etapa, o vazio explica o que vai aparecer ali',
      (tester) async {
    await _pumpAgenda(tester, const []);
    await tester.pumpAndSettle();

    expect(find.text('Nenhuma etapa com prazo'), findsOneWidget);
  });

  for (final width in [320.0, 360.0, 390.0]) {
    testWidgets('a grade do mes nao transborda em ${width.toInt()} px',
        (tester) async {
      final day = _dayOfThisMonth(14);
      await _pumpAgenda(
        tester,
        [
          for (var index = 0; index < 12; index++)
            _stage(id: '$index', deadline: day),
        ],
        surfaceSize: Size(width, 1400),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  }
}
