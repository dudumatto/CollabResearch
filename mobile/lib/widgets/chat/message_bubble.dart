import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/message.dart';
import '../common/app_bottom_sheet.dart';
import '../common/app_snackbar.dart';

/// Posicao da mensagem dentro de uma sequencia do mesmo remetente.
/// O padrao [single] preserva o desenho de uma bolha isolada.
enum BubbleGroupPosition { single, first, middle, last }

class MessageBubble extends StatelessWidget {
  const MessageBubble({
    super.key,
    required this.message,
    this.currentUserId,
    this.onEdit,
    this.onDelete,
    this.groupPosition = BubbleGroupPosition.single,
  });

  final Message message;
  final String? currentUserId;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final BubbleGroupPosition groupPosition;

  /// Canto colado no vizinho. O lado "justo" e o direito nas mensagens
  /// proprias e o esquerdo nas recebidas.
  static const double _tightRadius = 6;
  static const double _freeRadius = 18;

  bool get _startsGroup =>
      groupPosition == BubbleGroupPosition.single ||
      groupPosition == BubbleGroupPosition.first;

  bool get _endsGroup =>
      groupPosition == BubbleGroupPosition.single ||
      groupPosition == BubbleGroupPosition.last;

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine || message.senderId == currentUserId;
    final colorScheme = Theme.of(context).colorScheme;
    final receivedBackground = Color.alphaBlend(
      colorScheme.onSurface.withValues(alpha: 0.06),
      colorScheme.surface,
    );
    final background = isMine ? colorScheme.primary : receivedBackground;
    final foreground = isMine ? colorScheme.onPrimary : colorScheme.onSurface;
    // Branco sobre o verde da marca em 11-12px e o pior contraste da tela,
    // por isso a metadata da bolha propria fica menos transparente.
    final metadataColor = foreground.withValues(alpha: isMine ? 0.80 : 0.65);

    final time = DateFormat('HH:mm').format(message.sentAt);
    final showSenderName =
        !isMine && message.senderName != null && _startsGroup;
    final showMetadata = _endsGroup;
    final tightTop = _startsGroup ? _freeRadius : _tightRadius;

    return Semantics(
      label: _semanticsLabel(isMine, time),
      excludeSemantics: true,
      child: AnimatedPress(
        child: Align(
          alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
          child: GestureDetector(
            onLongPress: () => _showActions(context, isMine),
            child: Container(
              margin: EdgeInsets.only(
                top: _startsGroup ? AppSpacing.sm : 2,
                bottom: _endsGroup ? AppSpacing.sm : 2,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.sizeOf(context).width * 0.78,
                minWidth: 72,
              ),
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(isMine ? _freeRadius : tightTop),
                  topRight: Radius.circular(isMine ? tightTop : _freeRadius),
                  bottomLeft:
                      Radius.circular(isMine ? _freeRadius : _tightRadius),
                  bottomRight:
                      Radius.circular(isMine ? _tightRadius : _freeRadius),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (showSenderName) ...[
                    Text(
                      message.senderName!,
                      style: TextStyle(
                        color: colorScheme.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                  ],
                  Text(
                    message.content,
                    style: TextStyle(color: foreground, height: 1.3),
                  ),
                  if (showMetadata) ...[
                    const SizedBox(height: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (message.isEdited) ...[
                          Text(
                            'editada',
                            style:
                                TextStyle(color: metadataColor, fontSize: 11),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          time,
                          style: TextStyle(color: metadataColor, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// O leitor de tela recebe remetente e horario mesmo nas posicoes em que
  /// eles ficam visualmente suprimidos pelo agrupamento.
  String _semanticsLabel(bool isMine, String time) {
    final author = isMine ? 'Você' : (message.senderName ?? 'Contato');
    final edited = message.isEdited ? ', editada' : '';
    return '$author, $time$edited: ${message.content}';
  }

  Future<void> _showActions(BuildContext context, bool isMine) async {
    final action = await AppBottomSheet.show<_MessageAction>(
      context,
      title: 'Mensagem',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ActionTile(
            icon: Icons.copy_rounded,
            label: 'Copiar',
            onTap: () => Navigator.of(context).pop(_MessageAction.copy),
          ),
          if (isMine && onEdit != null)
            _ActionTile(
              icon: Icons.edit_outlined,
              label: 'Editar',
              onTap: () => Navigator.of(context).pop(_MessageAction.edit),
            ),
          if (isMine && onDelete != null)
            _ActionTile(
              icon: Icons.delete_outline,
              label: 'Excluir',
              isDestructive: true,
              onTap: () => Navigator.of(context).pop(_MessageAction.delete),
            ),
        ],
      ),
    );

    if (action == null) return;
    switch (action) {
      case _MessageAction.copy:
        await Clipboard.setData(ClipboardData(text: message.content));
        if (context.mounted) {
          AppSnackbar.showSuccess(context, 'Mensagem copiada.');
        }
      case _MessageAction.edit:
        onEdit?.call();
      case _MessageAction.delete:
        onDelete?.call();
    }
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = isDestructive ? colorScheme.error : colorScheme.onSurface;

    return ListTile(
      onTap: onTap,
      minVerticalPadding: AppSpacing.md,
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: color, size: 22),
      title: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

enum _MessageAction { copy, edit, delete }
