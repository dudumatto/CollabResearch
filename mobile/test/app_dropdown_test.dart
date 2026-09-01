import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/widgets/common/app_dropdown.dart';
import 'package:tcc_mobile/widgets/common/app_project_dropdown.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: Padding(padding: const EdgeInsets.all(16), child: child),
      ),
    ),
  );
}

const _itens = [
  AppDropdownItem(value: 'a', label: 'Aprovar'),
  AppDropdownItem(value: 'b', label: 'Solicitar ajustes'),
  AppDropdownItem(
    value: 'c',
    label: 'Rotulo bastante longo para forcar o corte do texto dentro da '
        'largura disponivel do campo',
  ),
];

void main() {
  group('AppDropdown', () {
    testWidgets('limita a largura do item selecionado', (tester) async {
      // Sem isExpanded o item selecionado nao e limitado pela largura do
      // campo, e o corte de rotulos longos difere entre telas.
      await _pump(
        tester,
        const AppDropdown<String>(
          value: 'c',
          label: 'Decisão',
          items: _itens,
          onChanged: null,
        ),
      );

      final dropdown = tester.widget<DropdownButton<String>>(
        find.byType(DropdownButton<String>),
      );
      expect(dropdown.isExpanded, isTrue);
    });

    testWidgets('sempre tem rotulo', (tester) async {
      // O seletor de decisao do dialogo "Revisar entrega" nao tinha nenhum:
      // o usuario via duas opcoes soltas, sem dizer do que se tratava.
      await _pump(
        tester,
        AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: (_) {},
        ),
      );

      expect(find.text('Decisão'), findsOneWidget);
    });

    testWidgets('nao transborda com rotulo longo em tela estreita',
        (tester) async {
      tester.view.physicalSize = const Size(360, 720);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await _pump(
        tester,
        const AppDropdown<String>(
          value: 'c',
          label: 'Decisão',
          items: _itens,
          onChanged: null,
        ),
      );

      expect(tester.takeException(), isNull);
    });

    testWidgets('devolve o valor escolhido', (tester) async {
      String? escolhido;
      await _pump(
        tester,
        AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: (value) => escolhido = value,
        ),
      );

      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Solicitar ajustes').last);
      await tester.pumpAndSettle();

      expect(escolhido, 'b');
    });

    testWidgets('funciona com valores nao textuais', (tester) async {
      int? escolhido;
      await _pump(
        tester,
        AppDropdown<int>(
          value: 5,
          label: 'Nota',
          items: const [
            AppDropdownItem(value: 4, label: '4 de 5'),
            AppDropdownItem(value: 5, label: '5 de 5'),
          ],
          onChanged: (value) => escolhido = value,
        ),
      );

      await tester.tap(find.byType(DropdownButtonFormField<int>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('4 de 5').last);
      await tester.pumpAndSettle();

      expect(escolhido, 4);
    });
  });

  testWidgets('o seletor de projeto herda a base do AppDropdown',
      (tester) async {
    await _pump(
      tester,
      AppProjectDropdown(
        value: '1',
        options: const [ProjectChoice(id: '1', title: 'Projeto A')],
        onChanged: (_) {},
      ),
    );

    expect(find.byType(AppDropdown<String>), findsOneWidget);
    expect(find.text('Projeto'), findsOneWidget);
    expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
  });
}
