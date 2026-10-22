import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

const _steps = [
  'Lendo as candidaturas',
  'Comparando com o projeto',
  'Gerando notas e ranking',
];

/// Modal de carregamento da avaliacao da Lumen (espelha o LumenLoadingModal
/// do web). Fica aberto ate quem chamou fecha-lo ou o usuario tocar em
/// "Continuar navegando".
class LumenLoadingDialog extends StatefulWidget {
  const LumenLoadingDialog({super.key});

  static Future<void> show(BuildContext context) => showDialog<void>(
        context: context,
        builder: (_) => const LumenLoadingDialog(),
      );

  @override
  State<LumenLoadingDialog> createState() => _LumenLoadingDialogState();
}

class _LumenLoadingDialogState extends State<LumenLoadingDialog> {
  int _step = 0;
  late final Timer _timer;

  @override
  void initState() {
    super.initState();
    // A ultima etapa fica "em andamento" ate a analise terminar.
    _timer = Timer.periodic(const Duration(milliseconds: 2600), (_) {
      if (_step < _steps.length - 1) setState(() => _step++);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                tooltip: 'Fechar',
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: SweepGradient(colors: [
                  primary,
                  AppColors.warning,
                  primary,
                ]),
              ),
              padding: const EdgeInsets.all(3),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.surface,
                ),
                child: Icon(Icons.auto_awesome, color: primary, size: 30),
              ),
            ),
            const SizedBox(height: 12),
            Text('Lumen IA',
                style: theme.textTheme.labelMedium?.copyWith(color: primary)),
            const SizedBox(height: 4),
            Text('Lumen está avaliando...',
                style: theme.textTheme.titleLarge,
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'Analisando as candidaturas e a compatibilidade de cada uma com '
              'o projeto.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            for (final (i, label) in _steps.indexed)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(children: [
                  i < _step
                      ? Icon(Icons.check_circle, size: 20, color: primary)
                      : i == _step
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Icon(Icons.circle_outlined,
                              size: 20, color: theme.disabledColor),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      label,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: i == _step ? FontWeight.w600 : null,
                        color: i > _step ? theme.disabledColor : null,
                      ),
                    ),
                  ),
                ]),
              ),
            const SizedBox(height: 12),
            const LinearProgressIndicator(),
            const SizedBox(height: 12),
            Text(
              'Pode continuar navegando. Avisaremos quando terminar.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Continuar navegando'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
