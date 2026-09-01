import 'package:flutter/material.dart';

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
/// Bordas, preenchimento e raio continuam vindo do InputDecorationTheme em
/// AppTheme._inputTheme; aqui ficam apenas as decisoes que o tema nao alcanca.
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

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: icon == null ? null : Icon(icon),
      ),
      items: [
        for (final item in items)
          DropdownMenuItem<T>(
            value: item.value,
            child: Text(item.label, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: onChanged,
    );
  }
}
