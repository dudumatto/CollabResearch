import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/utils/date_utils.dart';
import '../../models/conversation.dart';

class ConversationTile extends StatelessWidget {
  const ConversationTile({super.key, required this.conversation, this.onTap});

  final Conversation conversation;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasUnreadMessages = conversation.unreadCount > 0;
    final preview = conversation.lastMessage.trim().isEmpty
        ? 'Inicie a conversa'
        : conversation.lastMessage;

    return AnimatedPress(
      enabled: onTap != null,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(4, 12, 12, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: hasUnreadMessages
                          ? colorScheme.primary
                          : Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 23,
                    backgroundColor: colorScheme.primaryContainer,
                    foregroundImage: conversation.avatarUrl != null
                        ? NetworkImage(conversation.avatarUrl!)
                        : null,
                    child: Text(
                      conversation.title.isNotEmpty
                          ? conversation.title[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conversation.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: hasUnreadMessages
                                      ? FontWeight.w700
                                      : FontWeight.w600,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        preview,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              fontWeight: hasUnreadMessages
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      DateUtilsX.relative(conversation.lastUpdated),
                      style: TextStyle(
                        color: hasUnreadMessages
                            ? colorScheme.primary
                            : colorScheme.onSurfaceVariant,
                        fontSize: 11,
                        fontWeight: hasUnreadMessages
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 7),
                    if (hasUnreadMessages)
                      Container(
                        constraints: const BoxConstraints(minWidth: 22),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          conversation.unreadCount > 99
                              ? '99+'
                              : '${conversation.unreadCount}',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: colorScheme.onPrimary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      )
                    else
                      const SizedBox(height: 22),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
