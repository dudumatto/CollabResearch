import 'package:intl/intl.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
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
    final background = isMine ? AppColors.primary : AppColors.surfaceTint;
    final foreground = isMine ? Colors.white : AppColors.text;
    final metadataColor =
        isMine ? Colors.white.withValues(alpha: 0.75) : AppColors.muted;

    return Align(
      alignment: alignment,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isMine && (onEdit != null || onDelete != null)) ...[
            PopupMenuButton<_MessageAction>(
              tooltip: 'Acoes da mensagem',
              icon: const Icon(Icons.more_vert, size: 18),
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
                    child: Row(
                      children: [
                        Icon(Icons.edit_outlined, size: 18),
                        SizedBox(width: 8),
                        Text('Editar'),
                      ],
                    ),
                  ),
                if (onDelete != null)
                  const PopupMenuItem(
                    value: _MessageAction.delete,
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, size: 18),
                        SizedBox(width: 8),
                        Text('Excluir'),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 4),
          ],
          Container(
            margin: const EdgeInsets.symmetric(vertical: 6),
            padding: const EdgeInsets.all(12),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.74,
              minWidth: 72,
            ),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(14),
                topRight: const Radius.circular(14),
                bottomLeft: Radius.circular(isMine ? 14 : 4),
                bottomRight: Radius.circular(isMine ? 4 : 14),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isMine && message.senderName != null) ...[
                  Text(
                    message.senderName!,
                    style: const TextStyle(
                      color: AppColors.primaryDark,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  message.content,
                  style: TextStyle(color: foreground, height: 1.25),
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
