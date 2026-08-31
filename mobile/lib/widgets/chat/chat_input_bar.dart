import 'package:flutter/material.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class ChatInputBar extends StatefulWidget {
  const ChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    this.isSending = false,
  });

  final TextEditingController controller;
  final VoidCallback onSend;

  /// Enquanto verdadeiro, so o botao fica ocupado. O campo continua editavel
  /// de proposito: congelar a barra inteira impedia o usuario de ja comecar a
  /// escrever a proxima mensagem.
  final bool isSending;

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _hasText = widget.controller.text.trim().isNotEmpty;
    widget.controller.addListener(_handleTextChanged);
  }

  @override
  void didUpdateWidget(covariant ChatInputBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller == widget.controller) return;
    oldWidget.controller.removeListener(_handleTextChanged);
    widget.controller.addListener(_handleTextChanged);
    _handleTextChanged();
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleTextChanged);
    super.dispose();
  }

  void _handleTextChanged() {
    final hasText = widget.controller.text.trim().isNotEmpty;
    if (!mounted || hasText == _hasText) return;
    setState(() => _hasText = hasText);
  }

  void _handleSend() {
    if (!_hasText || widget.isSending) return;
    widget.onSend();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isLight = theme.brightness == Brightness.light;
    final borderColor = isLight ? AppColors.border : AppColors.darkBorder;
    final canSend = _hasText && !widget.isSending;

    return SafeArea(
      top: false,
      child: Material(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        elevation: 0,
        child: Container(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.xs,
            AppSpacing.xs,
            AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(AppRadius.pill),
            boxShadow: isLight ? AppShadows.lightLow : AppShadows.darkLow,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Semantics(
                  textField: true,
                  label: 'Mensagem',
                  child: TextField(
                    controller: widget.controller,
                    minLines: 1,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _handleSend(),
                    decoration: const InputDecoration(
                      hintText: 'Digite uma mensagem',
                      filled: false,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              _SendButton(
                enabled: canSend,
                isSending: widget.isSending,
                onPressed: _handleSend,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Botao de envio com tres estados reais: desabilitado enquanto nao ha texto,
/// pronto, e ocupado durante o envio.
class _SendButton extends StatelessWidget {
  const _SendButton({
    required this.enabled,
    required this.isSending,
    required this.onPressed,
  });

  final bool enabled;
  final bool isSending;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final background = enabled
        ? colorScheme.primary
        : colorScheme.onSurface.withValues(alpha: 0.10);
    final foreground =
        enabled ? colorScheme.onPrimary : colorScheme.onSurfaceVariant;

    final icon = isSending
        ? SizedBox.square(
            key: const ValueKey('chat-send-busy'),
            dimension: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(colorScheme.onPrimary),
            ),
          )
        : Icon(
            Icons.send_rounded,
            key: const ValueKey('chat-send-idle'),
            size: 20,
            color: foreground,
          );

    return Tooltip(
      message: 'Enviar mensagem',
      child: Semantics(
        button: true,
        enabled: enabled,
        label: isSending ? 'Enviando mensagem' : 'Enviar mensagem',
        excludeSemantics: true,
        child: AnimatedContainer(
          duration: reduceMotion ? AppDurations.instant : AppDurations.press,
          curve: AppCurves.press,
          decoration: BoxDecoration(
            color: isSending ? colorScheme.primary : background,
            shape: BoxShape.circle,
          ),
          child: Material(
            color: Colors.transparent,
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: enabled ? onPressed : null,
              child: SizedBox.square(
                dimension: 44,
                child: Center(
                  child: reduceMotion
                      ? icon
                      : AnimatedSwitcher(
                          duration: AppDurations.fast,
                          child: icon,
                        ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
