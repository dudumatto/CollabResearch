import 'package:flutter/material.dart';

import 'app_dropdown.dart';

/// Uma opcao do seletor de projeto. Existe para o widget servir tanto a
/// Project quanto a AdviseeProject, que nao tem relacao entre si mas ambos
/// carregam id e titulo.
class ProjectChoice {
  const ProjectChoice({required this.id, required this.title});

  final String id;
  final String title;
}

/// Seletor de projeto: [AppDropdown] com o rotulo e o icone ja definidos,
/// porque as cinco telas que escolhem projeto devem parecer a mesma coisa.
///
/// Antes cada uma montava o seu DropdownButtonFormField inline, e os cinco
/// divergiam: dois usavam Icons.folder_open_outlined e dois
/// Icons.folder_outlined para o mesmo controle, um nao tinha icone nenhum, e
/// feedback e progresso ficaram sem isExpanded.
class AppProjectDropdown extends StatelessWidget {
  const AppProjectDropdown({
    super.key,
    required this.value,
    required this.options,
    required this.onChanged,
    this.label = 'Projeto',
  });

  final String? value;
  final List<ProjectChoice> options;
  final ValueChanged<String?>? onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return AppDropdown<String>(
      value: value,
      label: label,
      icon: Icons.folder_outlined,
      items: [
        for (final option in options)
          AppDropdownItem(value: option.id, label: option.title),
      ],
      onChanged: onChanged,
    );
  }
}
