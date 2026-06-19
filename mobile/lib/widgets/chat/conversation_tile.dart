import 'package:flutter/material.dart';

import '../../models/conversation.dart';
import '../../core/utils/date_utils.dart';

class ConversationTile extends StatelessWidget {
  const ConversationTile({super.key, required this.conversation, this.onTap});

  final Conversation conversation;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: const CircleAvatar(child: Icon(Icons.person)),
      title: Text(conversation.title),
      subtitle: Text(conversation.lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(DateUtilsX.relative(conversation.lastUpdated)),
          if (conversation.unreadCount > 0)
            CircleAvatar(
              radius: 12,
              child: Text('${conversation.unreadCount}', style: const TextStyle(fontSize: 12)),
            ),
        ],
      ),
    );
  }
}
