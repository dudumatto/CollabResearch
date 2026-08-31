import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/animation/app_durations.dart';
import '../../core/utils/date_utils.dart';
import '../../models/conversation.dart';
import '../common/app_avatar.dart';

/// Linha da lista de conversas. Altura minima de 64 para a area de toque, a
/// linha inteira e clicavel e o conteudo segue a leitura tipica de lista de
/// mensagens: avatar, nome, previa e, a direita, horario e nao lidas.
class ConversationTile extends StatelessWidget {
  const ConversationTile({
    super.key,
    required this.conversation,
    this.onTap,
    this.isOpening = false,
  });

  final Conversation conversation;
  final VoidCallback? onTap;

  /// Enquanto a conversa esta sendo aberta a linha fica destacada e o
  /// horario da lugar a um indicador, evitando toques repetidos.
  final bool isOpening;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasUnreadMessages = conversation.unreadCount > 0;
    final hasPreview = conversation.lastMessage.trim().isNotEmpty;
    final preview = hasPreview ? conversation.lastMessage : 'Inicie a conversa';
    final timestamp = DateUtilsX.conversationTimestamp(
      conversation.lastUpdated,
    );
    final statusIcon = _statusIcon();

    return Semantics(
      button: true,
      enabled: onTap != null,
      label: _semanticsLabel(preview, timestamp),
      excludeSemantics: true,
      child: AnimatedPress(
        enabled: onTap != null && !isOpening,
        child: Material(
          color: isOpening
              ? colorScheme.primary.withValues(alpha: 0.06)
              : Colors.transparent,
          child: InkWell(
            onTap: isOpening ? null : onTap,
            splashColor: colorScheme.primary.withValues(alpha: 0.08),
            highlightColor: colorScheme.primary.withValues(alpha: 0.05),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 64),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    AppAvatar(
                      radius: 26,
                      name: conversation.title,
                      imageUrl: conversation.avatarUrl,
                      backgroundColor: colorScheme.primaryContainer,
                      foregroundColor: colorScheme.onPrimaryContainer,
                      initials: conversation.title.isNotEmpty
                          ? conversation.title[0].toUpperCase()
                          : '?',
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            conversation.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontSize: 15.5,
                              height: 1.2,
                              fontWeight: hasUnreadMessages
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              if (statusIcon != null) ...[
                                statusIcon,
                                const SizedBox(width: 4),
                              ],
                              Expanded(
                                child: Text(
                                  preview,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontSize: 13.5,
                                    height: 1.25,
                                    color: hasUnreadMessages
                                        ? colorScheme.onSurface
                                        : colorScheme.onSurfaceVariant,
                                    fontStyle: hasPreview
                                        ? FontStyle.normal
                                        : FontStyle.italic,
                                    fontWeight: hasUnreadMessages
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 52,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (isOpening)
                            const SizedBox.square(
                              dimension: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          else
                            Text(
                              timestamp,
                              maxLines: 1,
                              overflow: TextOverflow.clip,
                              style: TextStyle(
                                color: hasUnreadMessages
                                    ? colorScheme.primary
                                    : colorScheme.onSurfaceVariant,
                                fontSize: 11.5,
                                height: 1.2,
                                fontWeight: hasUnreadMessages
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                          const SizedBox(height: 6),
                          AnimatedSwitcher(
                            duration: AppDurations.fast,
                            child: hasUnreadMessages
                                ? _UnreadBadge(count: conversation.unreadCount)
                                : const SizedBox(height: 20, width: 0),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// So renderiza o indicador quando a API informa que a ultima mensagem e
  /// do usuario logado e qual o estado dela.
  Widget? _statusIcon() {
    final status = conversation.lastMessageStatus;
    if (conversation.lastMessageFromMe != true || status == null) return null;

    return Builder(
      builder: (context) {
        final colorScheme = Theme.of(context).colorScheme;
        return Icon(
          status == MessageDeliveryStatus.sent
              ? Icons.check_rounded
              : Icons.done_all_rounded,
          size: 15,
          color: status == MessageDeliveryStatus.read
              ? colorScheme.primary
              : colorScheme.onSurfaceVariant,
        );
      },
    );
  }

  String _semanticsLabel(String preview, String timestamp) {
    final parts = <String>[conversation.title, preview, timestamp];
    if (conversation.unreadCount > 0) {
      parts.add('${conversation.unreadCount} não lidas');
    }
    if (isOpening) parts.add('abrindo conversa');
    return parts.join(', ');
  }
}

class _UnreadBadge extends StatelessWidget {
  const _UnreadBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: 20,
      constraints: const BoxConstraints(minWidth: 20),
      padding: const EdgeInsets.symmetric(horizontal: 6),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: colorScheme.primary,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        count > 99 ? '99+' : '$count',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: colorScheme.onPrimary,
          fontSize: 11,
          height: 1,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
