import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

class AppBottomSheet extends StatelessWidget {
  const AppBottomSheet({
    super.key,
    required this.child,
    this.title,
    this.actions = const [],
    this.padding = const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      AppSpacing.sm,
      AppSpacing.lg,
      AppSpacing.xl,
    ),
  });

  final String? title;
  final Widget child;
  final List<Widget> actions;
  final EdgeInsetsGeometry padding;

  static Future<T?> show<T>(
    BuildContext context, {
    required Widget child,
    String? title,
    List<Widget> actions = const [],
    bool isScrollControlled = true,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      useSafeArea: true,
      builder: (_) => AppBottomSheet(
        title: title,
        actions: actions,
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding.add(
        EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null) ...[
            Text(title!, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.lg),
          ],
          Flexible(child: child),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              alignment: WrapAlignment.end,
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: actions,
            ),
          ],
        ],
      ),
    );
  }
}
