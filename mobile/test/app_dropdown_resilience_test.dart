import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/widgets/common/app_dropdown.dart';
import 'package:tcc_mobile/widgets/common/app_project_dropdown.dart';

Future<void> _pump(WidgetTester tester, Widget child, {ThemeData? theme}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: theme,
      home: Scaffold(
        body: Padding(padding: const EdgeInsets.all(16), child: child),
      ),
    ),
  );
}

const _opcoes = [
  AppDropdownItem(value: '1', label: 'Projeto A'),
  AppDropdownItem(value: '2', label: 'Projeto B'),
];

void main() {
  group('AppDropdown nao quebra a tela', () {
    testWidgets('valor que nao esta nas opcoes nao derruba a tela',
        (tester) async {
      // Cenario real: o detalhe de um projeto que o aluno pode ver mas do qual
      // nao participa leva para /evaluations?projectId=15. O id vai para o
      // seletor, mas o projeto nao aparece em "meus projetos" -- e o
      // DropdownButton lancava assertion, pintando a tela de vermelho.
      await _pump(
        tester,
        const AppDropdown<String>(
          value: '15',
          label: 'Projeto',
          items: _opcoes,
          onChanged: null,
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Projeto'), findsOneWidget);
    });

    testWidgets('valores repetidos na origem nao derrubam a tela',
        (tester) async {
      await _pump(
        tester,
        const AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: [
            AppDropdownItem(value: '1', label: 'Projeto A'),
            AppDropdownItem(value: '1', label: 'Projeto A repetido'),
            AppDropdownItem(value: '2', label: 'Projeto B'),
          ],
          onChanged: null,
        ),
      );

      expect(tester.takeException(), isNull);
    });

    testWidgets('o seletor de projeto herda a mesma protecao', (tester) async {
      await _pump(
        tester,
        AppProjectDropdown(
          value: '15',
          options: const [ProjectChoice(id: '1', title: 'Projeto A')],
          onChanged: (_) {},
        ),
      );

      expect(tester.takeException(), isNull);
    });

    testWidgets('um valor valido continua selecionado', (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: '2',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Projeto B'), findsOneWidget);
    });
  });

  group('dropdownValueIn protege os seletores montados a mao', () {
    // Area e orientador nos formularios de projeto ficam fora do AppDropdown
    // porque mantem isExpanded/isDense proprios, com teste no desktop.
    test('descarta valor ausente da lista', () {
      expect(dropdownValueIn(15, const [1, 2, 3]), isNull);
    });

    test('descarta valor repetido, que tambem quebra o widget', () {
      expect(dropdownValueIn(1, const [1, 1, 2]), isNull);
    });

    test('mantem valor valido', () {
      expect(dropdownValueIn(2, const [1, 2, 3]), 2);
    });

    test('nulo continua nulo', () {
      expect(dropdownValueIn<int>(null, const [1, 2]), isNull);
    });
  });

  group('menu suspenso segue a paleta', () {
    testWidgets('nao usa o lilas padrao do Material 3', (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
        theme: AppTheme.lightTheme,
      );

      final dropdown = tester.widget<DropdownButton<String>>(
        find.byType(DropdownButton<String>),
      );
      final scheme = AppTheme.lightTheme.colorScheme;

      expect(dropdown.dropdownColor, scheme.surface);
      expect(dropdown.dropdownColor, isNot(const Color(0xFFF7F2FA)));
    });

    testWidgets('o tema define canvasColor para os dropdowns fora do widget',
        (tester) async {
      // Os seletores dos formularios de projeto continuam sendo montados a
      // mao, e o DropdownButton usa canvasColor quando nao recebe cor.
      expect(AppTheme.lightTheme.canvasColor, isNot(const Color(0xFFF7F2FA)));
      expect(
        AppTheme.lightTheme.canvasColor,
        AppTheme.lightTheme.colorScheme.surface,
      );
    });
  });
}
