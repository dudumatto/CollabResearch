import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/project_provider.dart';
import 'package:tcc_mobile/providers/subscription_provider.dart';
import 'package:tcc_mobile/screens/projects/project_detail_screen.dart';
import 'package:tcc_mobile/screens/projects/projects_list_screen.dart';

const projectFixture = Project(
  id: '1',
  title: 'Plataforma colaborativa para pesquisa aplicada',
  area: 'Ciência de Dados',
  course: 'Engenharia de Software',
  status: 'ABERTO',
  vacancies: 4,
  collaborators: 2,
  advisorName: 'Professora Maria Silva',
);

class MobileAuthProvider extends AuthProvider {
  MobileAuthProvider() {
    token = 'test-token';
    currentUser = const User(
      id: 'student-1',
      name: 'Aluno Teste',
      email: 'aluno@example.com',
      type: 'ALUNO',
    );
  }
}

class MobileProjectProvider extends ProjectProvider {
  MobileProjectProvider() {
    projects.add(projectFixture);
  }

  @override
  Future<void> loadProjects({
    String? search,
    String? status,
    String? area,
    String? course,
  }) async {}
}

class DetailAuthProvider extends AuthProvider {
  DetailAuthProvider(User user) {
    token = 'test-token';
    currentUser = user;
  }
}

class DetailProjectProvider extends ProjectProvider {
  DetailProjectProvider(this.project);

  final Project project;

  @override
  Project? findProject(String id) => id == project.id ? project : null;

  @override
  Future<Project?> loadProject(
    String id, {
    bool forceRefresh = false,
  }) async =>
      project;

  @override
  Future<void> loadCollaborators(String projectId) async {}
}

class DetailSubscriptionProvider extends SubscriptionProvider {
  @override
  Future<void> load() async {}

  @override
  Future<void> loadForProject(String projectId) async {}
}

Widget buildProjectsApp({double textScale = 1}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>(create: (_) => MobileAuthProvider()),
      ChangeNotifierProvider<ProjectProvider>(
        create: (_) => MobileProjectProvider(),
      ),
    ],
    child: MaterialApp(
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(
          textScaler: TextScaler.linear(textScale),
        ),
        child: child!,
      ),
      home: const ProjectsListScreen(),
    ),
  );
}

Widget buildDetailApp(Project project, User user) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>(
        create: (_) => DetailAuthProvider(user),
      ),
      ChangeNotifierProvider<ProjectProvider>(
        create: (_) => DetailProjectProvider(project),
      ),
      ChangeNotifierProvider<SubscriptionProvider>(
        create: (_) => DetailSubscriptionProvider(),
      ),
    ],
    child: MaterialApp(
      home: ProjectDetailScreen(projectId: project.id),
    ),
  );
}

void configureMobileView(WidgetTester tester) {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(360, 900);
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.view.resetPhysicalSize);
}

void main() {
  testWidgets('oferece Explorar e Meus projetos no mobile', (tester) async {
    configureMobileView(tester);
    await tester.pumpWidget(buildProjectsApp());
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Explorar'), findsOneWidget);
    expect(find.text('Meus projetos'), findsOneWidget);
    expect(find.text(projectFixture.title), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('abre os filtros em uma bottom sheet no mobile', (tester) async {
    configureMobileView(tester);
    await tester.pumpWidget(buildProjectsApp());
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text('Filtros'));
    await tester.pumpAndSettle();

    expect(find.text('Filtrar projetos'), findsOneWidget);
    expect(find.text('Área'), findsOneWidget);
    expect(find.text('Curso'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('lista permanece responsiva com texto em 200%', (tester) async {
    configureMobileView(tester);
    await tester.pumpWidget(buildProjectsApp(textScale: 2));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Explorar'), findsOneWidget);
    expect(find.text(projectFixture.title), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('aluno externo pode se inscrever em projeto aberto',
      (tester) async {
    configureMobileView(tester);
    const project = Project(
      id: '9',
      title: 'Pesquisa aberta',
      area: 'Computação',
      course: 'ADS',
      status: 'ABERTO',
      vacancies: 2,
      collaborators: 1,
      advisorId: 'advisor-1',
      advisorName: 'Orientadora',
    );
    const student = User(
      id: 'student-2',
      name: 'Aluna',
      email: 'aluna@example.com',
      type: 'ALUNO',
    );

    await tester.pumpWidget(buildDetailApp(project, student));
    await tester.pumpAndSettle();

    expect(find.text('Inscrever-se'), findsOneWidget);
    expect(find.byTooltip('Editar projeto'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('orientador solicitado analisa orientação sem editar',
      (tester) async {
    configureMobileView(tester);
    const project = Project(
      id: '10',
      title: 'Pesquisa aguardando orientação',
      area: 'Educação',
      course: 'Pedagogia',
      status: 'PENDENTE_ORIENTADOR',
      vacancies: 2,
      advisorId: 'advisor-1',
      advisorName: 'Orientadora',
      ownerId: 'student-1',
    );
    const advisor = User(
      id: 'advisor-1',
      name: 'Orientadora',
      email: 'orientadora@example.com',
      type: 'ORIENTADOR',
    );

    await tester.pumpWidget(buildDetailApp(project, advisor));
    await tester.pumpAndSettle();

    expect(find.text('Aceitar orientação'), findsOneWidget);
    expect(find.text('Recusar orientação'), findsOneWidget);
    expect(find.byTooltip('Editar projeto'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('projeto finalizado permanece somente leitura', (tester) async {
    configureMobileView(tester);
    const project = Project(
      id: '11',
      title: 'Pesquisa concluída',
      area: 'Saúde',
      course: 'Enfermagem',
      status: 'FINALIZADO',
      vacancies: 2,
      advisorId: 'advisor-1',
      advisorName: 'Orientadora',
    );
    const advisor = User(
      id: 'advisor-1',
      name: 'Orientadora',
      email: 'orientadora@example.com',
      type: 'ORIENTADOR',
    );

    await tester.pumpWidget(buildDetailApp(project, advisor));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Editar projeto'), findsNothing);
    expect(find.byTooltip('Excluir projeto'), findsNothing);
    expect(find.text('Iniciar projeto'), findsNothing);
    expect(find.text('Finalizar projeto'), findsNothing);
    expect(find.text('Acompanhamento'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  test('interpreta resposta paginada de projetos', () {
    final page = ProjectPage.fromPayload({
      'content': [
        {
          'id': 1,
          'titulo': 'Projeto paginado',
          'areaNome': 'Computação',
          'cursoNome': 'ADS',
          'status': 'ABERTO',
        },
      ],
      'page': 1,
      'totalPages': 3,
      'totalElements': 21,
      'last': false,
    });

    expect(page.items.single.title, 'Projeto paginado');
    expect(page.page, 1);
    expect(page.totalPages, 3);
    expect(page.totalElements, 21);
    expect(page.isLast, isFalse);
  });
}
