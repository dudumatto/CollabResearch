import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import 'app_dialog.dart';

/// Confirmacao unica de saida, usada pelo Perfil e por Configuracoes. Antes
/// o item de Configuracoes deslogava direto: um toque acidental derrubava a
/// sessao sem nenhuma pergunta.
Future<void> confirmLogout(BuildContext context) async {
  final confirmed = await AppDialog.show<bool>(
    context,
    title: 'Sair da conta',
    icon: Icons.logout_rounded,
    content: const Text(
      'Você vai precisar entrar de novo para acompanhar seus projetos e '
      'conversas neste aparelho.',
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(false),
        child: const Text('Cancelar'),
      ),
      FilledButton(
        style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
        onPressed: () => Navigator.of(context).pop(true),
        child: const Text('Sair'),
      ),
    ],
  );

  if (confirmed != true || !context.mounted) return;
  await context.read<AuthProvider>().logout();
  if (context.mounted) context.go('/login');
}
