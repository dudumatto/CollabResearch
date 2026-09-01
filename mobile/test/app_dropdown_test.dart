import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/widgets/common/app_dropdown.dart';

Future<void> _pump(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.lightTheme,
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

Future<void> _abrirMenu(WidgetTester tester) async {
  await tester.tap(find.byType(AppDropdown<String>));
  await tester.pumpAndSettle();
}

void main() {
  group('AppDropdown', () {
    testWidgets('a lista abre abaixo do campo, sem cobri-lo', (tester) async {
      // O DropdownButton anterior sobrepunha o campo e alinhava a opcao
      // selecionada com o botao, escondendo o que se estava lendo.
      await _pump(
        tester,
        AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: (_) {},
        ),
      );

      final campo = tester.getRect(find.byType(AppDropdown<String>));
      await _abrirMenu(tester);

      final primeiraOpcao =
          tester.getRect(find.text('Solicitar ajustes').last);

      expect(
        primeiraOpcao.top,
        greaterThanOrEqualTo(campo.bottom),
        reason: 'a lista precisa comecar depois do campo, nao por cima dele',
      );
    });

    testWidgets('o campo continua visivel com o menu aberto', (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: (_) {},
        ),
      );
      await _abrirMenu(tester);

      expect(find.text('Decisão'), findsOneWidget);
    });

    testWidgets('tocar nao abre o teclado', (tester) async {
      // requestFocusOnTap: false -- em tela pequena o teclado cobriria
      // justamente as opcoes.
      await _pump(
        tester,
        AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: (_) {},
        ),
      );
      await _abrirMenu(tester);

      final campo = tester.widget<TextField>(find.byType(TextField));
      expect(campo.canRequestFocus, isFalse);
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

      await _abrirMenu(tester);
      await tester.tap(find.text('Solicitar ajustes').last);
      await tester.pumpAndSettle();

      expect(escolhido, 'b');
    });

    testWidgets('funciona com valores nao textuais', (tester) async {
      int? escolhido;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: AppDropdown<int>(
              value: 5,
              label: 'Nota',
              items: const [
                AppDropdownItem(value: 4, label: '4 de 5'),
                AppDropdownItem(value: 5, label: '5 de 5'),
              ],
              onChanged: (value) => escolhido = value,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(AppDropdown<int>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('4 de 5').last);
      await tester.pumpAndSettle();

      expect(escolhido, 4);
    });

    testWidgets('nao transborda com rotulo longo em tela estreita',
        (tester) async {
      tester.view.physicalSize = const Size(360, 720);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await _pump(
        tester,
        AppDropdown<String>(
          value: 'c',
          label: 'Decisão',
          items: _itens,
          onChanged: (_) {},
        ),
      );

      expect(tester.takeException(), isNull);
    });

    testWidgets('sem onChanged o campo fica desabilitado', (tester) async {
      await _pump(
        tester,
        const AppDropdown<String>(
          value: 'a',
          label: 'Decisão',
          items: _itens,
          onChanged: null,
        ),
      );

      final menu = tester.widget<DropdownMenu<String>>(
        find.byType(DropdownMenu<String>),
      );
      expect(menu.enabled, isFalse);
    });
  });
}
