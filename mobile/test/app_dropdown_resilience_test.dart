import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/widgets/common/app_dropdown.dart';
import 'package:tcc_mobile/widgets/common/app_project_dropdown.dart';

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
      // seletor, mas o projeto nao aparece em "meus projetos" -- e o widget
      // anterior lancava assertion, pintando a tela de vermelho.
      await _pump(
        tester,
        AppDropdown<String>(
          value: '15',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Projeto'), findsOneWidget);
    });

    testWidgets('valores repetidos na origem nao derrubam a tela',
        (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: const [
            AppDropdownItem(value: '1', label: 'Projeto A'),
            AppDropdownItem(value: '1', label: 'Projeto A repetido'),
            AppDropdownItem(value: '2', label: 'Projeto B'),
          ],
          onChanged: (_) {},
        ),
      );

      expect(tester.takeException(), isNull);

      await tester.tap(find.byType(AppDropdown<String>));
      await tester.pumpAndSettle();

      // A duplicata sai antes de montar: sobra uma entrada por valor.
      expect(find.text('Projeto A repetido'), findsNothing);
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

    testWidgets('um valor valido aparece no campo', (tester) async {
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

    testWidgets('valor definido depois do carregamento aparece no campo',
        (tester) async {
      // As telas so sabem o projeto depois da resposta do backend, entao o
      // valor chega em um rebuild posterior.
      await _pump(
        tester,
        AppDropdown<String>(
          value: null,
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      await _pump(
        tester,
        AppDropdown<String>(
          value: '2',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );
      await tester.pumpAndSettle();

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

  group('menu suspenso segue a paleta e a escala do app', () {
    testWidgets('nao usa o lilas padrao do Material 3', (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      final menu = tester.widget<DropdownMenu<String>>(
        find.byType(DropdownMenu<String>),
      );
      final fundo = menu.menuStyle?.backgroundColor
          ?.resolve(<WidgetState>{});

      expect(fundo, AppTheme.lightTheme.colorScheme.surface);
      expect(fundo, isNot(const Color(0xFFF7F2FA)));
    });

    testWidgets('as opcoes usam a tipografia de menu do app', (tester) async {
      // O padrao seria 16sp em peso 600, o mesmo de um titulo de secao.
      // popupMenuTheme ja usa bodyMedium, entao os menus combinam.
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      final menu = tester.widget<DropdownMenu<String>>(
        find.byType(DropdownMenu<String>),
      );

      expect(menu.textStyle?.fontSize, 14.0,
          reason: 'corpo de texto de menu; o padrao era 16 de titulo');
      expect(menu.textStyle?.fontWeight, FontWeight.w400,
          reason: 'o padrao era peso 600, que pesava demais');
    });

    testWidgets('lista longa nao cobre a tela inteira', (tester) async {
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Area',
          items: [
            for (var i = 1; i <= 20; i++)
              AppDropdownItem(value: '$i', label: 'Area $i'),
          ],
          onChanged: (_) {},
        ),
      );

      final menu = tester.widget<DropdownMenu<String>>(
        find.byType(DropdownMenu<String>),
      );

      expect(menu.menuHeight, isNotNull);
      expect(menu.menuHeight, lessThanOrEqualTo(320));
    });

    testWidgets('a opcao aberta cabe num alvo de toque confortavel',
        (tester) async {
      // A regra da casa pede areas clicaveis confortaveis no mobile: o texto
      // menor nao pode encolher o alvo abaixo do minimo do Material.
      await _pump(
        tester,
        AppDropdown<String>(
          value: '1',
          label: 'Projeto',
          items: _opcoes,
          onChanged: (_) {},
        ),
      );

      await tester.tap(find.byType(AppDropdown<String>));
      await tester.pumpAndSettle();

      final linha = find
          .ancestor(
            of: find.text('Projeto B').last,
            matching: find.byType(InkWell),
          )
          .first;

      expect(tester.getSize(linha).height,
          greaterThanOrEqualTo(kMinInteractiveDimension));
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
