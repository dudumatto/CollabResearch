import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'confirm_logout.dart';

/// Menu de tres pontos fixo nas telas: leva a Area academica. [onGradient]
/// usa o estilo branco translucido do AppPageHeader; sem ele, herda a cor da
/// AppBar.
class AcademicMenuButton extends StatelessWidget {
  const AcademicMenuButton({super.key, this.onGradient = false});

  final bool onGradient;

  @override
  Widget build(BuildContext context) {
    final button = PopupMenuButton<String>(
      tooltip: 'Mais opções',
      icon: Icon(
        Icons.more_vert,
        color: onGradient ? Colors.white : null,
        size: 22,
      ),
      onSelected: (value) {
        final router = GoRouter.maybeOf(context);
        if (value == 'academic' &&
            router != null &&
            GoRouterState.of(context).matchedLocation != '/academic') {
          router.push('/academic');
        } else if (value == 'logout') {
          confirmLogout(context);
        }
      },
      itemBuilder: (_) => const [
        PopupMenuItem<String>(
          value: 'academic',
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.school_outlined),
            title: Text('Área acadêmica'),
          ),
        ),
        PopupMenuItem<String>(
          value: 'logout',
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.logout_rounded),
            title: Text('Sair da conta'),
          ),
        ),
      ],
    );
    if (!onGradient) return button;
    return Material(
      color: Colors.white.withValues(alpha: 0.18),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: button,
    );
  }
}
