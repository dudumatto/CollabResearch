import 'package:flutter/material.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_spacing.dart';

/// Campo de busca leve: pilula, icone alinhado, botao de limpar e anel de
/// foco. Usa o `InputDecorationTheme` do app apenas para cor de texto,
/// desenhando a propria borda para manter a altura compacta.
class AppSearchField extends StatefulWidget {
  const AppSearchField({
    super.key,
    required this.controller,
    required this.hintText,
    required this.onChanged,
    this.focusNode,
    this.autofocus = false,
  });

  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String> onChanged;
  final FocusNode? focusNode;
  final bool autofocus;

  @override
  State<AppSearchField> createState() => _AppSearchFieldState();
}

class _AppSearchFieldState extends State<AppSearchField> {
  late FocusNode _focusNode;
  bool _ownsFocusNode = false;
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _ownsFocusNode = widget.focusNode == null;
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void didUpdateWidget(covariant AppSearchField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode == widget.focusNode) return;
    _focusNode.removeListener(_handleFocusChange);
    if (_ownsFocusNode) _focusNode.dispose();
    _ownsFocusNode = widget.focusNode == null;
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
  }

  void _handleFocusChange() {
    if (!mounted || _focused == _focusNode.hasFocus) return;
    setState(() => _focused = _focusNode.hasFocus);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    if (_ownsFocusNode) _focusNode.dispose();
    super.dispose();
  }

  void _clear() {
    widget.controller.clear();
    widget.onChanged('');
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: widget.controller,
      builder: (context, value, _) {
        return AnimatedContainer(
          duration: AppDurations.fast,
          curve: AppCurves.standard,
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(AppRadius.pill),
            border: Border.all(
              color: _focused
                  ? colorScheme.primary
                  : colorScheme.outlineVariant.withValues(alpha: 0.9),
              width: _focused ? 1.6 : 1,
            ),
            boxShadow: _focused
                ? [
                    BoxShadow(
                      color: colorScheme.primary.withValues(alpha: 0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 14, right: 8),
                child: Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: _focused
                      ? colorScheme.primary
                      : colorScheme.onSurfaceVariant,
                ),
              ),
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  onChanged: widget.onChanged,
                  textInputAction: TextInputAction.search,
                  style: theme.textTheme.bodyMedium?.copyWith(fontSize: 14.5),
                  decoration: InputDecoration(
                    isDense: true,
                    filled: false,
                    hintText: widget.hintText,
                    hintStyle: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: 14.5,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 13),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                  ),
                ),
              ),
              // Area de toque de 44x44 mesmo com o icone pequeno.
              SizedBox.square(
                dimension: 44,
                child: value.text.isEmpty
                    ? const SizedBox.shrink()
                    : IconButton(
                        onPressed: _clear,
                        tooltip: 'Limpar busca',
                        padding: EdgeInsets.zero,
                        iconSize: 18,
                        splashRadius: 20,
                        color: colorScheme.onSurfaceVariant,
                        icon: const Icon(Icons.close_rounded),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
