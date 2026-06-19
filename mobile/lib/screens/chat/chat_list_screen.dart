import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/chat_provider.dart';
import '../../widgets/chat/conversation_tile.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      body: Consumer<ChatProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.conversations.isEmpty) {
            return const LoadingIndicator(label: 'Carregando conversas...');
          }

          return RefreshIndicator(
            onRefresh: provider.loadConversations,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const TextField(
                  decoration: InputDecoration(
                    labelText: 'Buscar conversa',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
                const SizedBox(height: 16),
                if (provider.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      provider.errorMessage!,
                      style:
                          TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                if (provider.conversations.isEmpty)
                  const SizedBox(
                    height: 280,
                    child: EmptyState(
                      title: 'Nenhuma conversa encontrada',
                      subtitle: 'Puxe para atualizar.',
                    ),
                  )
                else
                  ...provider.conversations.map(
                    (conversation) => ConversationTile(
                      conversation: conversation,
                      onTap: () => context.go(
                        '/chat/${conversation.id}',
                        extra: conversation.title,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
