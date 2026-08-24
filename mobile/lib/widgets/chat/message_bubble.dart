import 'package:intl/intl.dart';
import 'package:flutter/material.dart';

import '../../models/message.dart';

class MessageBubble extends StatelessWidget {
  const MessageBubble({
    super.key,
    required this.message,
    this.currentUserId,
    this.onEdit,
    this.onDelete,
  });

  final Message message;
  final String? currentUserId;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine || message.senderId == currentUserId;
    final alignment = isMine ? Alignment.centerRight : Alignment.centerLeft;
    final colorScheme = Theme.of(context).colorScheme;
    final receivedBackground = Color.alphaBlend(
      colorScheme.onSurface.withValues(alpha: 0.06),
      colorScheme.surface,
    );
    final background = isMine ? colorScheme.primary : receivedBackground;
    final foreground = isMine ? colorScheme.onPrimary : colorScheme.onSurface;
    final metadataColor = foreground.withValues(alpha: 0.72);

    return Align(
      alignment: alignment,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isMine && (onEdit != null || onDelete != null)) ...[
            PopupMenuButton<_MessageAction>(
              tooltip: 'Acoes da mensagem',
              constraints: const BoxConstraints(minWidth: 52, maxWidth: 52),
              icon: Icon(
                Icons.more_vert,
                size: 18,
                color: colorScheme.onSurfaceVariant,
              ),
              onSelected: (action) {
                switch (action) {
                  case _MessageAction.edit:
                    onEdit?.call();
                    break;
                  case _MessageAction.delete:
                    onDelete?.call();
                    break;
                }
              },
              itemBuilder: (context) => [
                if (onEdit != null)
                  const PopupMenuItem(
                    value: _MessageAction.edit,
                    height: 44,
                    padding: EdgeInsets.zero,
                    child: Tooltip(
                      message: 'Editar mensagem',
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Icon(Icons.edit_outlined, size: 20),
                          Opacity(opacity: 0, child: Text('Editar')),
                        ],
                      ),
                    ),
                  ),
                if (onDelete != null)
                  const PopupMenuItem(
                    value: _MessageAction.delete,
                    height: 44,
                    padding: EdgeInsets.zero,
                    child: Tooltip(
                      message: 'Excluir mensagem',
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Icon(Icons.delete_outline, size: 20),
                          Opacity(opacity: 0, child: Text('Excluir')),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 4),
          ],
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.76,
              minWidth: 72,
            ),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMine ? 18 : 5),
                bottomRight: Radius.circular(isMine ? 5 : 18),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isMine && message.senderName != null) ...[
                  Text(
                    message.senderName!,
                    style: TextStyle(
                      color: colorScheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  message.content,
                  style: TextStyle(color: foreground, height: 1.3),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (message.isEdited) ...[
                      Text(
                        'editada',
                        style: TextStyle(color: metadataColor, fontSize: 11),
                      ),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      DateFormat('HH:mm').format(message.sentAt),
                      style: TextStyle(color: metadataColor, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _MessageAction {
  edit,
  delete,
}
