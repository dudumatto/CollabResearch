import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/widgets/common/app_project_dropdown.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(home: Scaffold(body: Padding(padding: const EdgeInsets.all(16), child: child))),
  );
}

const _tresProjetos = [
  ProjectChoice(id: '1', title: 'Projeto A'),
  ProjectChoice(id: '2', title: 'Projeto B'),
  ProjectChoice(
    id: '3',
    title: 'Projeto com titulo bastante longo para forcar o corte do texto '
        'dentro da largura disponivel do seletor',
  ),
];

void main() {
  group('AppProjectDropdown', () {
    testWidgets('limita a largura do item selecionado', (tester) async {
      // Sem isExpanded o item selecionado nao e limitado pela largura, e o
      // ellipsis dos titulos longos nao se comporta igual entre as telas.
      // Feedback e progresso estavam assim.
      await _pump(
        tester,
        const AppProjectDropdown(
          value: '3',
          options: _tresProjetos,
          onChanged: null,
        ),
      );

      final dropdown = tester.widget<DropdownButton<String>>(
        find.byType(DropdownButton<String>),
      );
      expect(dropdown.isExpanded, isTrue);
    });

    testWidgets('nao transborda com titulo longo', (tester) async {
      tester.view.physicalSize = const Size(360, 720);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await _pump(
        tester,
        const AppProjectDropdown(
          value: '3',
          options: _tresProjetos,
          onChanged: null,
        ),
      );

      expect(tester.takeException(), isNull);
    });

    testWidgets('rotula o campo como Projeto', (tester) async {
      await _pump(
        tester,
        AppProjectDropdown(
          value: '1',
          options: _tresProjetos,
          onChanged: (_) {},
        ),
      );

      expect(find.text('Projeto'), findsOneWidget);
      expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
    });

    testWidgets('lista as opcoes e devolve o id escolhido', (tester) async {
      String? escolhido;
      await _pump(
        tester,
        AppProjectDropdown(
          value: '1',
          options: _tresProjetos,
          onChanged: (value) => escolhido = value,
        ),
      );

      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Projeto B').last);
      await tester.pumpAndSettle();

      expect(escolhido, '2');
    });
  });
}
