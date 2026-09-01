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
/// Antes cada tela montava o proprio DropdownButtonFormField e as diferencas
/// se acumulavam: um dialogo sem rotulo nenhum, uns com isExpanded e outros
/// sem, corte de texto ora presente ora ausente. Sem isExpanded o item
/// selecionado nao e limitado pela largura do campo, entao o ellipsis nao
/// atua da mesma forma e rotulos longos se comportam diferente entre telas.
///
/// Bordas, preenchimento e raio do campo continuam vindo do
/// InputDecorationTheme em AppTheme._inputTheme; aqui ficam as decisoes que o
/// tema nao alcanca -- inclusive a aparencia do menu suspenso, que o tema nao
/// cobre e por isso caia no lilas padrao do Material 3.
///
/// Os seletores de area e orientador dos formularios de projeto ficam de fora
/// por decisao propria: eles alternam isExpanded/isDense conforme a largura e
/// ha teste fixando esse comportamento no desktop.
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

  /// O DropdownButton exige exatamente um item com o valor atual e lanca
  /// assertion quando ha zero ou mais de um. Duas situacoes reais levam a
  /// isso, e nenhuma delas merece derrubar a tela:
  ///
  /// - o valor vem de fora e nao esta na lista. Abrir um projeto que se pode
  ///   ver mas do qual nao se participa e tocar em Avaliacoes empurra o id
  ///   pela rota (`/evaluations?projectId=X`), mas esse projeto nao aparece
  ///   em "meus projetos" -- a tela quebrava inteira com a tela vermelha de
  ///   assertion;
  /// - a origem repete um valor, e ai o widget nao sabe qual item destacar.
  ///
  /// Preferimos o campo vazio, ou a primeira ocorrencia, a perder a tela.
  List<AppDropdownItem<T>> get _uniqueItems {
    final seen = <T>{};
    return [
      for (final item in items)
        if (seen.add(item.value)) item,
    ];
  }

  @override
  Widget build(BuildContext context) {
    final options = _uniqueItems;
    final selectable =
        options.any((item) => item.value == value) ? value : null;
    final theme = Theme.of(context);

    return DropdownButtonFormField<T>(
      initialValue: selectable,
      isExpanded: true,
      // Sem isto o menu usa o padrao do Material 3, um lilas que destoa do
      // verde da marca -- a mesma armadilha que app_colors.dart ja registra
      // para as superficies de container.
      dropdownColor: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(12),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: icon == null ? null : Icon(icon),
      ),
      items: [
        for (final item in options)
          DropdownMenuItem<T>(
            value: item.value,
            child: Text(item.label, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: onChanged,
    );
  }
}
