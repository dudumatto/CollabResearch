import 'package:flutter/material.dart';

/// Devolve [value] so quando ele aparece exatamente uma vez em [available].
///
/// O DropdownButton lanca assertion e derruba a tela quando o valor atual nao
/// esta entre os itens, ou esta repetido. Para os seletores montados a mao --
/// area e orientador nos formularios de projeto, que mantem isExpanded e
/// isDense proprios e por isso ficam fora de [AppDropdown] -- esta funcao da a
/// mesma protecao sem mexer no layout deles. Ex.: editar um projeto cuja area
/// nao esta mais na lista carregada mostrava a tela vermelha de assertion.
T? dropdownValueIn<T extends Object>(T? value, Iterable<T> available) {
  final current = value;
  if (current == null) return null;
  return available.where((item) => item == current).length == 1
      ? current
      : null;
}

/// Uma opcao de [AppDropdown]. O rotulo e texto puro de proposito: todos os
/// seletores do app listam texto, e manter assim garante o mesmo tratamento
/// de corte em todos eles.
class AppDropdownItem<T> {
  const AppDropdownItem({required this.value, required this.label});

  final T value;
  final String label;
}

/// Seletor padrao do app.
///
/// Usa [DropdownMenu], e nao DropdownButtonFormField, por causa de onde a
/// lista aparece: o DropdownButton sobrepoe o campo e alinha a opcao
/// selecionada com o botao, escondendo o que se estava lendo. O DropdownMenu
/// ancora a lista logo abaixo do campo, que continua visivel.
///
/// `requestFocusOnTap: false` deixa o campo somente-leitura: tocar abre a
/// lista e nao o teclado. Em lista curta o teclado so atrapalharia, e em tela
/// pequena ele cobriria justamente as opcoes.
///
/// Bordas, preenchimento e raio do campo continuam vindo do
/// InputDecorationTheme em AppTheme._inputTheme.
///
/// Os seletores de area e orientador dos formularios de projeto NAO usam este
/// widget: eles alternam isExpanded/isDense conforme a largura, com teste
/// fixando o comportamento no desktop, e por isso continuam abrindo por cima.
/// Quem for unificar aquilo precisa reescrever projects_responsive_test.
class AppDropdown<T> extends StatelessWidget {
  const AppDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
    required this.label,
    this.icon,
  });

  final T? value;
  final List<AppDropdownItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final String label;
  final IconData? icon;

  /// Um valor repetido deixa o widget sem saber qual entrada destacar, e a
  /// origem as vezes repete. Ficamos com a primeira ocorrencia.
  List<AppDropdownItem<T>> get _uniqueItems {
    final seen = <T>{};
    return [
      for (final item in items)
        if (seen.add(item.value)) item,
    ];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final options = _uniqueItems;

    // Valor vindo de fora pode nao estar na lista: abrir um projeto que se
    // pode ver mas do qual nao se participa e tocar em Avaliacoes empurra o id
    // pela rota, e esse projeto nao aparece em "meus projetos". O DropdownMenu
    // ignora um initialSelection que nao encontra, mas manter a checagem
    // explicita deixa a intencao clara e vale para qualquer origem.
    final selected =
        options.any((item) => item.value == value) ? value : null;

    final entryStyle = ButtonStyle(
      textStyle: WidgetStatePropertyAll<TextStyle?>(theme.textTheme.bodyMedium),
    );

    return DropdownMenu<T>(
      initialSelection: selected,
      enabled: onChanged != null,
      requestFocusOnTap: false,
      // Acompanha a largura do pai, como o campo antigo fazia com isExpanded.
      expandedInsets: EdgeInsets.zero,
      // Lista longa -- areas de pesquisa, orientandos -- rola dentro do menu
      // em vez de cobrir a tela.
      menuHeight: 288,
      label: Text(label),
      leadingIcon: icon == null ? null : Icon(icon),
      // O padrao do menu seria 16sp em peso 600, o mesmo de um titulo de
      // secao. bodyMedium e o que o popupMenuTheme ja usa para menus.
      textStyle: theme.textTheme.bodyMedium,
      menuStyle: MenuStyle(
        // Sem isto o menu cai no lilas padrao do Material 3, que destoa do
        // verde da marca.
        backgroundColor: WidgetStatePropertyAll<Color>(
          theme.colorScheme.surface,
        ),
        shape: WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      dropdownMenuEntries: [
        for (final item in options)
          DropdownMenuEntry<T>(
            value: item.value,
            label: item.label,
            style: entryStyle,
          ),
      ],
      onSelected: onChanged,
    );
  }
}
