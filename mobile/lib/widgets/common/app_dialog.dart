import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

class AppDialog extends StatelessWidget {
  const AppDialog({
    super.key,
    required this.title,
    required this.content,
    this.actions = const [],
    this.icon,
  });

  final String title;
  final Widget content;
  final List<Widget> actions;
  final IconData? icon;

  static Future<T?> show<T>(
    BuildContext context, {
    required String title,
    required Widget content,
    List<Widget> actions = const [],
    IconData? icon,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (_) => AppDialog(
        title: title,
        content: content,
        actions: actions,
        icon: icon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      icon: icon == null
          ? null
          : Icon(icon, color: theme.colorScheme.primary, size: 28),
      title: Text(title),
      content: content,
      actionsPadding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        0,
        AppSpacing.xl,
        AppSpacing.lg,
      ),
      actions: actions,
    );
  }
}
