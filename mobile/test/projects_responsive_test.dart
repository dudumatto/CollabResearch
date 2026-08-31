import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/project_provider.dart';
import 'package:tcc_mobile/screens/projects/create_project_screen.dart';
import 'package:tcc_mobile/screens/projects/edit_project_screen.dart';
import 'package:tcc_mobile/screens/projects/projects_list_screen.dart';
import 'package:tcc_mobile/widgets/projects/project_card.dart';

const _project = Project(
  id: '1',
  title:
      'Desenvolvimento de uma plataforma colaborativa para pesquisa cientifica',
  area: 'Ciencias Exatas e Tecnologicas Aplicadas',
  course: 'Ciencia da Computacao e Engenharia de Software',
  status: 'PENDENTE_ORIENTADOR',
  vacancies: 12,
  collaborators: 12345,
  description: 'Descricao completa do projeto.',
  advisorName: 'Professora Maria Aparecida de Souza e Silva',
  advisorId: 'advisor-1',
  ownerId: 'owner-1',
  areaId: 1,
);

class _ResponsiveAuthProvider extends AuthProvider {
  _ResponsiveAuthProvider() {
    token = 'test-token';
    currentUser = const User(
      id: 'owner-1',
      name: 'Usuario Teste',
      email: 'usuario@example.com',
      type: 'ALUNO',
    );
  }
}

class _ResponsiveProjectProvider extends ProjectProvider {
  _ResponsiveProjectProvider() {
    projects.add(_project);
    areas.add(
      const ProjectOption(
        id: 1,
        name: 'Ciencias Exatas e Tecnologicas Aplicadas com Nome Extenso',
      ),
    );
    advisors.add(
      const ProjectOption(
        id: 1,
        name: 'Professora Maria Aparecida de Souza e Silva com Nome Extenso',
      ),
    );
  }

  @override
  Future<Project?> loadProject(
    String id, {
    bool forceRefresh = false,
  }) async =>
      _project;

  @override
  Future<void> loadProjects({
    String? search,
    String? status,
    String? area,
    String? course,
  }) async {}

  @override
  Future<void> loadFormOptions({required bool includeAdvisors}) async {}
}

class _DesktopProjectProvider extends _ResponsiveProjectProvider {
  _DesktopProjectProvider() {
    areas
      ..clear()
      ..add(const ProjectOption(id: 1, name: 'Tecnologia'));
    advisors
      ..clear()
      ..add(const ProjectOption(id: 1, name: 'Maria Silva'));
  }
}

Widget _withProviders(Widget child, {ProjectProvider? projectProvider}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>(
        create: (_) => _ResponsiveAuthProvider(),
      ),
      ChangeNotifierProvider<ProjectProvider>(
        create: (_) => projectProvider ?? _ResponsiveProjectProvider(),
      ),
    ],
    child: MaterialApp(home: child),
  );
}

Future<void> _pumpAtWidth(WidgetTester tester, double width, Widget child,
    {ProjectProvider? projectProvider}) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = Size(width, 900);
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.view.resetPhysicalSize);
  await tester.pumpWidget(
    _withProviders(child, projectProvider: projectProvider),
  );
  await tester.pump(const Duration(milliseconds: 500));
}

void main() {
  for (final width in [320.0, 360.0, 375.0, 412.0, 480.0, 599.0]) {
    testWidgets('lista ativa o card mobile em $width px', (tester) async {
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await _pumpAtWidth(tester, width, const ProjectsListScreen());

      expect(tester.takeException(), isNull);
      expect(
          tester.widget<ProjectCard>(find.byType(ProjectCard)).mobile, isTrue);
    });

    testWidgets('card preserva textos sem overflow em $width px',
        (tester) async {
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await _pumpAtWidth(
        tester,
        width,
        const Scaffold(body: ProjectCard(project: _project, mobile: true)),
      );

      expect(tester.takeException(), isNull);
      expect(tester.widget<Text>(find.text(_project.title)).maxLines, isNull);
      expect(find.text(_project.area), findsOneWidget);
      expect(find.text(_project.course), findsOneWidget);
      expect(
        tester
            .widget<Text>(find.text('${_project.advisorName} (orientador)'))
            .maxLines,
        isNull,
      );
    });

    testWidgets('formulario de criacao nao transborda em $width px',
        (tester) async {
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await _pumpAtWidth(tester, width, const CreateProjectScreen());

      expect(tester.takeException(), isNull);
    });

    testWidgets('formulario de edicao nao transborda em $width px',
        (tester) async {
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await _pumpAtWidth(
        tester,
        width,
        const EditProjectScreen(projectId: '1'),
      );

      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('mantem o card original no desktop', (tester) async {
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await _pumpAtWidth(
      tester,
      1024,
      const Scaffold(body: ProjectCard(project: _project)),
    );

    expect(tester.takeException(), isNull);
    expect(tester.widget<Text>(find.text(_project.title)).maxLines, 2);
    expect(find.text('${_project.area} - ${_project.course}'), findsOneWidget);
    expect(
      tester
          .widget<Text>(find.text('${_project.advisorName} (orientador)'))
          .maxLines,
      1,
    );
  });

  testWidgets('mantem os dropdowns originais no desktop', (tester) async {
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await _pumpAtWidth(
      tester,
      1024,
      const CreateProjectScreen(),
      projectProvider: _DesktopProjectProvider(),
    );

    expect(tester.takeException(), isNull);
    final dropdowns = tester.widgetList<DropdownButton<int>>(
      find.byType(DropdownButton<int>),
    );
    expect(dropdowns, hasLength(2));
    expect(dropdowns.every((dropdown) => !dropdown.isExpanded), isTrue);
    expect(dropdowns.every((dropdown) => dropdown.isDense), isTrue);
  });
}
