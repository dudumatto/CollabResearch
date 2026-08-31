import 'package:flutter/material.dart';

abstract final class AppSnackbar {
  static void showSuccess(BuildContext context, String message) {
    _show(
      context,
      message,
      icon: Icons.check_circle_outline_rounded,
      backgroundColor: Theme.of(context).colorScheme.primary,
      foregroundColor: Theme.of(context).colorScheme.onPrimary,
    );
  }

  static void showError(BuildContext context, String message) {
    _show(
      context,
      message,
      icon: Icons.error_outline_rounded,
      backgroundColor: Theme.of(context).colorScheme.error,
      foregroundColor: Theme.of(context).colorScheme.onError,
    );
  }

  static void showInfo(BuildContext context, String message) {
    final scheme = Theme.of(context).colorScheme;
    _show(
      context,
      message,
      icon: Icons.info_outline_rounded,
      backgroundColor: scheme.secondary,
      foregroundColor: scheme.onSecondary,
    );
  }

  static void _show(
    BuildContext context,
    String message, {
    required IconData icon,
    required Color backgroundColor,
    required Color foregroundColor,
  }) {
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: backgroundColor,
          content: Row(
            children: [
              Icon(icon, color: foregroundColor),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: TextStyle(color: foregroundColor),
                ),
              ),
            ],
          ),
        ),
      );
  }
}
