import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/widgets/projects/project_card.dart';

void main() {
  testWidgets('exibe informacoes do projeto', (tester) async {
    const project = Project(
      id: '1',
      title: 'Projeto X',
      area: 'TI',
      course: 'ADS',
      status: 'Ativo',
      vacancies: 2,
      collaborators: 1,
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ProjectCard(project: project),
        ),
      ),
    );

    expect(find.text('Projeto X'), findsOneWidget);
    expect(find.text('TI - ADS'), findsOneWidget);
    expect(find.text('Ativo'), findsWidgets);
  });
}

