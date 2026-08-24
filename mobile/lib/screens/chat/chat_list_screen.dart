import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/conversation.dart';
import '../../providers/auth_provider.dart';
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
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadConversations();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showNewConversation() async {
    final currentUserId = context.read<AuthProvider>().currentUser?.id;
    if (currentUserId == null || currentUserId.isEmpty) return;

    final provider = context.read<ChatProvider>();
    await provider.loadContacts(currentUserId);
    if (!mounted) return;

    final conversation = await showModalBottomSheet<Conversation>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _NewConversationSheet(),
    );
    if (conversation != null && mounted) {
      context.go(
        '/chat/${conversation.id}',
        extra: conversation.title,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewConversation,
        icon: const Icon(Icons.chat_bubble_outline),
        label: const Text('Nova conversa'),
      ),
      body: Consumer<ChatProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.conversations.isEmpty) {
            return const LoadingIndicator(label: 'Carregando conversas...');
          }

          final normalizedQuery = _query.trim().toLowerCase();
          final conversations = provider.conversations.where((conversation) {
            return normalizedQuery.isEmpty ||
                conversation.title.toLowerCase().contains(normalizedQuery) ||
                conversation.lastMessage
                    .toLowerCase()
                    .contains(normalizedQuery);
          }).toList();

          return RefreshIndicator(
            onRefresh: provider.loadConversations,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (value) => setState(() => _query = value),
                  decoration: const InputDecoration(
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
                if (conversations.isEmpty)
                  SizedBox(
                    height: 280,
                    child: EmptyState(
                      title: normalizedQuery.isEmpty
                          ? 'Nenhuma conversa encontrada'
                          : 'Nenhum resultado encontrado',
                      subtitle: normalizedQuery.isEmpty
                          ? 'Inicie uma conversa ou puxe para atualizar.'
                          : 'Tente buscar por outro termo.',
                    ),
                  )
                else
                  ...conversations.map(
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

class _NewConversationSheet extends StatefulWidget {
  const _NewConversationSheet();

  @override
  State<_NewConversationSheet> createState() => _NewConversationSheetState();
}

class _NewConversationSheetState extends State<_NewConversationSheet> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _openingUserId;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openConversation(String userId) async {
    setState(() => _openingUserId = userId);
    final conversation =
        await context.read<ChatProvider>().openPrivateConversation(userId);
    if (!mounted) return;
    if (conversation == null) {
      setState(() => _openingUserId = null);
      return;
    }
    Navigator.of(context).pop(conversation);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, _) {
        final normalizedQuery = _query.trim().toLowerCase();
        final contacts = chatProvider.contacts.where((user) {
          return normalizedQuery.isEmpty ||
              user.name.toLowerCase().contains(normalizedQuery) ||
              user.email.toLowerCase().contains(normalizedQuery);
        }).toList();

        return FractionallySizedBox(
          heightFactor: 0.82,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              24,
              12,
              24,
              24 + MediaQuery.viewInsetsOf(context).bottom,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Nova conversa',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  autofocus: true,
                  onChanged: (value) => setState(() => _query = value),
                  decoration: const InputDecoration(
                    labelText: 'Buscar pessoa',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
                const SizedBox(height: 12),
                if (chatProvider.contactsErrorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      chatProvider.contactsErrorMessage!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                Expanded(
                  child: contacts.isEmpty
                      ? const EmptyState(
                          title: 'Nenhum contato encontrado',
                          subtitle: 'Tente buscar por outro nome.',
                        )
                      : ListView.separated(
                          itemCount: contacts.length,
                          separatorBuilder: (_, __) => const Divider(),
                          itemBuilder: (context, index) {
                            final user = contacts[index];
                            final isOpening = _openingUserId == user.id;
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(
                                child: Text(
                                  user.name.isEmpty
                                      ? 'U'
                                      : user.name[0].toUpperCase(),
                                ),
                              ),
                              title: Text(user.name),
                              subtitle: Text(user.email),
                              trailing: isOpening
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.chevron_right),
                              enabled: _openingUserId == null,
                              onTap: () => _openConversation(user.id),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
