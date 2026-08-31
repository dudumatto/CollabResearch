import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/conversation.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/conversation_tile.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/empty_state.dart';

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
      backgroundColor: Colors.transparent,
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
      appBar: AppBar(
        titleSpacing: 24,
        title: Text(
          'Chat',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: IconButton(
              onPressed: _showNewConversation,
              tooltip: 'Nova conversa',
              color: Theme.of(context).colorScheme.onSurface,
              icon: const Icon(Icons.edit_square, size: 26),
            ),
          ),
        ],
      ),
      body: Consumer<ChatProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.conversations.isEmpty) {
            return const ConversationListSkeleton();
          }

          if (provider.errorMessage != null) {
            return RefreshIndicator(
              onRefresh: provider.loadConversations,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: AppErrorState(
                      message: provider.errorMessage!,
                      onRetry: provider.loadConversations,
                    ),
                  ),
                ],
              ),
            );
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
            child: LayoutBuilder(
              builder: (context, constraints) {
                final horizontalPadding =
                    constraints.maxWidth < 420 ? 16.0 : 24.0;

                return ListView(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    8,
                    horizontalPadding,
                    24,
                  ),
                  children: [
                    Text(
                      'Acompanhe suas conversas acadêmicas.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _searchController,
                      onChanged: (value) => setState(() => _query = value),
                      textInputAction: TextInputAction.search,
                      decoration: const InputDecoration(
                        hintText: 'Buscar conversa',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
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
                    else ...[
                      for (var index = 0;
                          index < conversations.length;
                          index++) ...[
                        ConversationTile(
                          conversation: conversations[index],
                          onTap: () => context.go(
                            '/chat/${conversations[index].id}',
                            extra: conversations[index].title,
                          ),
                        ),
                        if (index < conversations.length - 1)
                          const SizedBox(height: 10),
                      ],
                    ],
                  ],
                );
              },
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
          heightFactor: 0.86,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(28),
              ),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final horizontalPadding =
                    constraints.maxWidth < 420 ? 20.0 : 24.0;

                return Padding(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    12,
                    horizontalPadding,
                    20 + MediaQuery.viewInsetsOf(context).bottom,
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
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .primaryContainer,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.people_outline,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onPrimaryContainer,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Contatos',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  'Escolha uma pessoa para conversar.',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            tooltip: 'Fechar',
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      TextField(
                        controller: _searchController,
                        autofocus: true,
                        onChanged: (value) => setState(() => _query = value),
                        textInputAction: TextInputAction.search,
                        decoration: const InputDecoration(
                          hintText: 'Buscar pessoa',
                          prefixIcon: Icon(Icons.search_rounded),
                        ),
                      ),
                      const SizedBox(height: 14),
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
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 8),
                                itemBuilder: (context, index) {
                                  final user = contacts[index];
                                  final isOpening = _openingUserId == user.id;
                                  final colorScheme =
                                      Theme.of(context).colorScheme;

                                  return Material(
                                    color: Colors.transparent,
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.fromLTRB(
                                        4,
                                        4,
                                        12,
                                        4,
                                      ),
                                      leading: CircleAvatar(
                                        backgroundColor:
                                            colorScheme.primaryContainer,
                                        foregroundImage: user.avatarUrl != null
                                            ? NetworkImage(user.avatarUrl!)
                                            : null,
                                        child: Text(
                                          user.name.isEmpty
                                              ? 'U'
                                              : user.name[0].toUpperCase(),
                                          style: TextStyle(
                                            color:
                                                colorScheme.onPrimaryContainer,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      title: Text(
                                        user.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      subtitle: Text(
                                        user.email,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      trailing: isOpening
                                          ? const SizedBox(
                                              width: 22,
                                              height: 22,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            )
                                          : Icon(
                                              Icons.chat_bubble_outline,
                                              color: colorScheme.primary,
                                            ),
                                      enabled: _openingUserId == null,
                                      onTap: () => _openConversation(user.id),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}
