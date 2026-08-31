import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/animation/app_durations.dart';
import '../../models/conversation.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/conversation_tile.dart';
import '../../widgets/common/app_avatar.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_search_field.dart';
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

  /// Evita toques duplicados no botao de nova conversa enquanto a folha de
  /// contatos esta abrindo.
  bool _isOpeningContacts = false;

  /// Conversa cuja abertura foi solicitada, para dar retorno visual na linha.
  String? _openingConversationId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = context.read<ChatProvider>();
      // O shell ja dispara a primeira carga; repetir aqui devolvia o
      // esqueleto por cima de uma lista que ja estava pronta.
      if (provider.isLoading || provider.hasLoadedConversations) return;
      provider.loadConversations();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showNewConversation() async {
    if (_isOpeningContacts) return;
    setState(() => _isOpeningContacts = true);

    final currentUserId = context.read<AuthProvider>().currentUser?.id;
    final provider = context.read<ChatProvider>();
    // A folha abre imediatamente e mostra o proprio carregamento. Antes o
    // botao esperava a rede terminar antes de qualquer retorno na tela.
    unawaited(provider.loadContacts(currentUserId));

    try {
      final conversation = await showModalBottomSheet<Conversation>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        backgroundColor: Colors.transparent,
        builder: (_) => _NewConversationSheet(currentUserId: currentUserId),
      );
      if (!mounted) return;
      if (conversation != null) {
        _openConversation(conversation);
      }
    } finally {
      if (mounted) setState(() => _isOpeningContacts = false);
    }
  }

  void _openConversation(Conversation conversation) {
    if (_openingConversationId != null) return;
    setState(() => _openingConversationId = conversation.id);
    context.go('/chat/${conversation.id}', extra: conversation.title);
    Future<void>.delayed(AppDurations.normal, () {
      if (mounted) setState(() => _openingConversationId = null);
    });
  }

  void _handleQueryChanged(String value) {
    if (_query == value) return;
    setState(() => _query = value);
  }

  List<Conversation> _filter(List<Conversation> conversations) {
    final normalizedQuery = _query.trim().toLowerCase();
    if (normalizedQuery.isEmpty) return conversations;
    return conversations.where((conversation) {
      return conversation.title.toLowerCase().contains(normalizedQuery) ||
          conversation.lastMessage.toLowerCase().contains(normalizedQuery);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<ChatProvider>(
        builder: (context, provider, _) {
          final hasQuery = _query.trim().isNotEmpty;
          final conversations = _filter(provider.conversations);

          return SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final horizontalPadding =
                    constraints.maxWidth < 420 ? 16.0 : 24.0;

                return Column(
                  children: [
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        horizontalPadding,
                        12,
                        horizontalPadding,
                        12,
                      ),
                      child: Column(
                        children: [
                          AppPageHeader(
                            compact: true,
                            eyebrow: 'Conversas',
                            title: 'Chat',
                            description: 'Suas conversas acadêmicas.',
                            trailing: _NewConversationButton(
                              isBusy: _isOpeningContacts,
                              onPressed: _showNewConversation,
                            ),
                          ),
                          AppSearchField(
                            controller: _searchController,
                            hintText: 'Buscar conversa',
                            onChanged: _handleQueryChanged,
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: _ChatListBody(
                        provider: provider,
                        conversations: conversations,
                        hasQuery: hasQuery,
                        openingConversationId: _openingConversationId,
                        onOpenConversation: _openConversation,
                        onNewConversation: _showNewConversation,
                      ),
                    ),
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

/// Area rolavel da tela. Ocupa toda a altura restante abaixo do cabecalho
/// fixo e nunca fica sob a barra de navegacao, que e um
/// `bottomNavigationBar` do shell.
class _ChatListBody extends StatelessWidget {
  const _ChatListBody({
    required this.provider,
    required this.conversations,
    required this.hasQuery,
    required this.openingConversationId,
    required this.onOpenConversation,
    required this.onNewConversation,
  });

  final ChatProvider provider;
  final List<Conversation> conversations;
  final bool hasQuery;
  final String? openingConversationId;
  final ValueChanged<Conversation> onOpenConversation;
  final VoidCallback onNewConversation;

  @override
  Widget build(BuildContext context) {
    if (provider.isLoading && provider.conversations.isEmpty) {
      return const ConversationListSkeleton(includeHeader: false);
    }

    if (provider.errorMessage != null && provider.conversations.isEmpty) {
      return _RefreshableCenter(
        onRefresh: provider.loadConversations,
        child: AppErrorState(
          message: provider.errorMessage!,
          onRetry: provider.loadConversations,
        ),
      );
    }

    if (conversations.isEmpty) {
      return _RefreshableCenter(
        onRefresh: provider.loadConversations,
        child: hasQuery
            ? const EmptyState(
                icon: Icons.search_off_rounded,
                title: 'Nenhum resultado encontrado',
                subtitle: 'Tente buscar por outro nome ou termo.',
              )
            : EmptyState(
                icon: Icons.forum_outlined,
                title: 'Nenhuma conversa ainda',
                subtitle: 'Escolha um contato para começar a conversar.',
                action: AppButton(
                  label: 'Nova conversa',
                  icon: Icons.edit_square,
                  onPressed: onNewConversation,
                ),
              ),
      );
    }

    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return RefreshIndicator(
      onRefresh: provider.loadConversations,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.only(bottom: 16 + bottomInset),
            itemCount: conversations.length,
            separatorBuilder: (context, index) => Divider(
              height: 1,
              thickness: 0.7,
              indent: 78,
              endIndent: 16,
              color: Theme.of(context).colorScheme.outlineVariant.withValues(
                    alpha: 0.7,
                  ),
            ),
            itemBuilder: (context, index) {
              final conversation = conversations[index];
              return ConversationTile(
                conversation: conversation,
                isOpening: openingConversationId == conversation.id,
                onTap: () => onOpenConversation(conversation),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Mantem o "puxe para atualizar" funcionando nas telas de estado vazio.
class _RefreshableCenter extends StatelessWidget {
  const _RefreshableCenter({required this.onRefresh, required this.child});

  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverFillRemaining(hasScrollBody: false, child: child),
        ],
      ),
    );
  }
}

/// Botao de nova conversa: area de toque de 48x48, estados de toque, hover,
/// foco e ocupado, e indicador enquanto a folha de contatos abre.
class _NewConversationButton extends StatelessWidget {
  const _NewConversationButton({required this.isBusy, required this.onPressed});

  final bool isBusy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Nova conversa',
      child: Material(
        color: Colors.white.withValues(alpha: isBusy ? 0.10 : 0.18),
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: IconButton(
          onPressed: isBusy ? null : onPressed,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          color: Colors.white,
          disabledColor: Colors.white.withValues(alpha: 0.6),
          focusColor: Colors.white.withValues(alpha: 0.24),
          hoverColor: Colors.white.withValues(alpha: 0.16),
          splashColor: Colors.white.withValues(alpha: 0.28),
          highlightColor: Colors.white.withValues(alpha: 0.20),
          icon: AnimatedSwitcher(
            duration: AppDurations.fast,
            child: isBusy
                ? const SizedBox.square(
                    key: ValueKey('new-conversation-busy'),
                    dimension: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(
                    Icons.edit_square,
                    key: ValueKey('new-conversation-idle'),
                    size: 22,
                    semanticLabel: 'Nova conversa',
                  ),
          ),
        ),
      ),
    );
  }
}

class _NewConversationSheet extends StatefulWidget {
  const _NewConversationSheet({required this.currentUserId});

  final String? currentUserId;

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
    if (_openingUserId != null) return;
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
                            constraints: const BoxConstraints(
                              minWidth: 44,
                              minHeight: 44,
                            ),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      AppSearchField(
                        controller: _searchController,
                        hintText: 'Buscar pessoa',
                        autofocus: true,
                        onChanged: (value) {
                          if (_query == value) return;
                          setState(() => _query = value);
                        },
                      ),
                      const SizedBox(height: 14),
                      Expanded(
                        child: _ContactsBody(
                          chatProvider: chatProvider,
                          contacts: contacts,
                          hasQuery: normalizedQuery.isNotEmpty,
                          openingUserId: _openingUserId,
                          onOpen: _openConversation,
                          onRetry: () =>
                              chatProvider.loadContacts(widget.currentUserId),
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

class _ContactsBody extends StatelessWidget {
  const _ContactsBody({
    required this.chatProvider,
    required this.contacts,
    required this.hasQuery,
    required this.openingUserId,
    required this.onOpen,
    required this.onRetry,
  });

  final ChatProvider chatProvider;
  final List<User> contacts;
  final bool hasQuery;
  final String? openingUserId;
  final ValueChanged<String> onOpen;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (chatProvider.isLoadingContacts && chatProvider.contacts.isEmpty) {
      return ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 6,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, __) => const ListItemSkeleton(),
      );
    }

    if (chatProvider.contactsErrorMessage != null &&
        chatProvider.contacts.isEmpty) {
      return AppErrorState(
        message: chatProvider.contactsErrorMessage!,
        onRetry: onRetry,
      );
    }

    if (contacts.isEmpty) {
      return EmptyState(
        icon: Icons.person_search_outlined,
        title: 'Nenhum contato encontrado',
        subtitle: hasQuery
            ? 'Tente buscar por outro nome.'
            : 'Você ainda não tem contatos disponíveis.',
      );
    }

    return Column(
      children: [
        if (chatProvider.contactsErrorMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              chatProvider.contactsErrorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        Expanded(
          child: ListView.separated(
            itemCount: contacts.length,
            separatorBuilder: (_, __) => const SizedBox(height: 4),
            itemBuilder: (context, index) {
              final user = contacts[index];
              final isOpening = openingUserId == user.id;
              final colorScheme = Theme.of(context).colorScheme;

              return ListTile(
                contentPadding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
                minVerticalPadding: 8,
                leading: AppAvatar(
                  name: user.name,
                  imageUrl: user.avatarUrl,
                  radius: 22,
                  initials: user.name.isEmpty ? 'U' : null,
                ),
                title: Text(
                  user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  user.email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: isOpening
                    ? const SizedBox.square(
                        dimension: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        Icons.chat_bubble_outline,
                        color: colorScheme.primary,
                      ),
                enabled: openingUserId == null,
                onTap: () => onOpen(user.id),
              );
            },
          ),
        ),
      ],
    );
  }
}
