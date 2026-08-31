import 'package:flutter/material.dart';

class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.controller,
    this.obscureText = false,
    this.maxLines = 1,
    this.keyboardType,
    this.validator,
    this.prefixIcon,
    this.textInputAction,
    this.readOnly = false,
    this.onTap,
    this.suffixIcon,
    this.hintText,
    this.helperText,
    this.errorText,
    this.obscureToggle = true,
    this.enabled = true,
  });

  final String label;
  final TextEditingController? controller;
  final bool obscureText;
  final int maxLines;
  final TextInputType? keyboardType;
  final FormFieldValidator<String>? validator;
  final IconData? prefixIcon;
  final TextInputAction? textInputAction;
  final bool readOnly;
  final VoidCallback? onTap;
  final IconData? suffixIcon;
  final String? hintText;
  final String? helperText;
  final String? errorText;
  final bool obscureToggle;
  final bool enabled;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscureText;
  late final FocusNode _focusNode;
  late bool _hasContent;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
    _hasContent = widget.controller?.text.isNotEmpty ?? false;
    _focusNode = FocusNode()..addListener(_handleVisualStateChange);
    widget.controller?.addListener(_handleVisualStateChange);
  }

  @override
  void didUpdateWidget(covariant AppTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller?.removeListener(_handleVisualStateChange);
      widget.controller?.addListener(_handleVisualStateChange);
      _hasContent = widget.controller?.text.isNotEmpty ?? false;
    }
    if (oldWidget.obscureText != widget.obscureText) {
      _obscureText = widget.obscureText;
    }
  }

  void _handleVisualStateChange() {
    if (widget.controller != null) {
      _hasContent = widget.controller!.text.isNotEmpty;
    }
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_handleVisualStateChange);
    _focusNode
      ..removeListener(_handleVisualStateChange)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final fillColor = !widget.enabled
        ? colorScheme.onSurface.withValues(alpha: 0.035)
        : widget.errorText != null
            ? colorScheme.errorContainer.withValues(alpha: 0.28)
            : _focusNode.hasFocus
                ? colorScheme.primary.withValues(alpha: 0.055)
                : _hasContent
                    ? colorScheme.primary.withValues(alpha: 0.025)
                    : colorScheme.surface;

    return TextFormField(
      controller: widget.controller,
      focusNode: _focusNode,
      enabled: widget.enabled,
      obscureText: _obscureText,
      maxLines: widget.maxLines,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      readOnly: widget.readOnly,
      onTap: widget.onTap,
      validator: widget.validator,
      onChanged: (value) {
        _hasContent = value.isNotEmpty;
        _handleVisualStateChange();
      },
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hintText,
        helperText: widget.helperText,
        errorText: widget.errorText,
        fillColor: fillColor,
        prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon),
        suffixIcon: widget.obscureText && widget.obscureToggle
            ? IconButton(
                tooltip: _obscureText ? 'Mostrar senha' : 'Ocultar senha',
                onPressed: () => setState(() => _obscureText = !_obscureText),
                icon: Icon(
                  _obscureText
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              )
            : widget.suffixIcon == null
                ? null
                : Icon(widget.suffixIcon),
      ),
    );
  }
}
