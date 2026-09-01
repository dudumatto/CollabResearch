import 'package:flutter/material.dart';

/// Uma opcao do seletor de projeto. Existe para o widget servir tanto a
/// Project quanto a AdviseeProject, que nao tem relacao entre si mas ambos
/// carregam id e titulo.
class ProjectChoice {
  const ProjectChoice({required this.id, required this.title});

  final String id;
  final String title;
}

/// Seletor de projeto compartilhado.
///
/// Antes cada tela montava o seu DropdownButtonFormField inline, e os cinco
/// divergiam: dois usavam Icons.folder_open_outlined e dois
/// Icons.folder_outlined para o mesmo controle, um nao tinha icone nenhum, e
/// feedback e progresso ficaram sem isExpanded -- sem ele o item selecionado
/// nao e limitado pela largura, entao o ellipsis dos titulos longos nao se
/// comporta igual ao das outras telas.
///
/// Bordas, preenchimento e raio ja vem do InputDecorationTheme em
/// AppTheme._inputTheme; o que este widget fixa e o que o tema nao alcanca.
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
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.folder_outlined),
      ),
      items: [
        for (final option in options)
          DropdownMenuItem(
            value: option.id,
            child: Text(option.title, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: onChanged,
    );
  }
}
