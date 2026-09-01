import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
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
  @override
  Future<void> loadAgenda(List<Project> projects) async {}

  @override
  List<ProjectStage> stagesFor(String projectId) => const [];
}

/// Monta um router com a Agenda como raiz (o caso da aba) e uma rota de
/// projeto que empurra a Agenda por cima (o caso vindo do detalhe).
Future<GoRouter> _pumpWithRouter(
  WidgetTester tester, {
  required String initialLocation,
}) async {
  await tester.binding.setSurfaceSize(const Size(390, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final router = GoRouter(
    initialLocation: initialLocation,
    routes: [
      GoRoute(
        path: '/agenda',
        builder: (context, state) => AgendaScreen(
          projectId: state.uri.queryParameters['projectId'],
        ),
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) => Scaffold(
          body: Center(
            child: TextButton(
              onPressed: () => context.push('/agenda?projectId=4'),
              child: const Text('Agenda do projeto'),
            ),
          ),
        ),
      ),
    ],
  );

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => _FakeAuthProvider()),
        ChangeNotifierProvider<ResearchActivityProvider>(
          create: (_) => _FakeProjectsProvider(),
        ),
        ChangeNotifierProvider<AcademicWorkspaceProvider>(
          create: (_) => _FakeAcademicProvider(),
        ),
      ],
      child: MaterialApp.router(
        theme: AppTheme.lightTheme,
        routerConfig: router,
      ),
    ),
  );
  await tester.pump();
  return router;
}

void main() {
  testWidgets('como aba, a agenda nao mostra botao de voltar', (tester) async {
    await _pumpWithRouter(tester, initialLocation: '/agenda');

    expect(find.text('Agenda acadêmica'), findsOneWidget);
    expect(find.byTooltip('Voltar'), findsNothing);
  });

  testWidgets('aberta pelo projeto, a agenda oferece volta ao projeto',
      (tester) async {
    await _pumpWithRouter(tester, initialLocation: '/projects/4');

    await tester.tap(find.text('Agenda do projeto'));
    await tester.pumpAndSettle();

    // Titulo muda para o contexto do projeto...
    expect(find.text('Agenda do projeto'), findsOneWidget);
    // ...e existe saida de volta, que antes nao havia.
    expect(find.byTooltip('Voltar'), findsOneWidget);
  });

  testWidgets('o botao de voltar realmente retorna ao projeto', (tester) async {
    await _pumpWithRouter(tester, initialLocation: '/projects/4');

    await tester.tap(find.text('Agenda do projeto'));
    await tester.pumpAndSettle();
    // Na agenda: existe o cabecalho com o botao de voltar.
    expect(find.byTooltip('Voltar'), findsOneWidget);

    await tester.tap(find.byTooltip('Voltar'));
    await tester.pumpAndSettle();

    // De volta ao projeto: o botao de voltar da agenda saiu de cena e o
    // conteudo do projeto reaparece.
    expect(find.byTooltip('Voltar'), findsNothing);
    expect(find.text('Agenda do projeto'), findsOneWidget);
    expect(find.text('Prazos reais'.toUpperCase()), findsNothing);
  });
}
