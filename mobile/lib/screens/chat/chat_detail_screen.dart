import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/message.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/chat_input_bar.dart';
import '../../widgets/chat/message_bubble.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/app_snackbar.dart';
import '../../widgets/common/app_avatar.dart';

class ChatDetailScreen extends StatefulWidget {
  const ChatDetailScreen({
    super.key,
    required this.conversationId,
    this.conversationTitle,
    this.targetMessageId,
  });

  final String conversationId;
  final String? conversationTitle;
  final String? targetMessageId;

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  /// Acima deste deslocamento o usuario claramente saiu do fim da conversa.
  /// A lista e invertida, entao offset 0 e a mensagem mais recente.
  static const double _jumpToLatestThreshold = 240;

  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final Map<String, GlobalKey> _messageKeys = <String, GlobalKey>{};

  /// Ids ja renderizados. Sem isso, todo o historico animaria ao abrir a
  /// conversa, que e justamente a animacao pesada que as regras proibem.
  final Set<String> _seenMessageIds = <String>{};

  ChatProvider? _provider;
  String? _lastScrolledTargetMessageId;
  bool _isSending = false;
  bool _hasCompletedFirstLoad = false;
  bool _showJumpToLatest = false;
  int _messagesWhileAway = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadConversation();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final provider = context.read<ChatProvider>();
    if (identical(provider, _provider)) return;
    _provider?.removeListener(_handleProviderUpdate);
    _provider = provider..addListener(_handleProviderUpdate);
  }

  @override
  void dispose() {
    _provider?.removeListener(_handleProviderUpdate);
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ChatDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.conversationId != widget.conversationId) {
      _messageKeys.clear();
      _seenMessageIds.clear();
      _lastScrolledTargetMessageId = null;
      _hasCompletedFirstLoad = false;
      _showJumpToLatest = false;
      _messagesWhileAway = 0;
      _loadConversation();
    } else if (oldWidget.targetMessageId != widget.targetMessageId) {
      _lastScrolledTargetMessageId = null;
    }
  }

  void _loadConversation() {
    final provider = context.read<ChatProvider>();
    if (provider.conversations.isEmpty) {
      provider.loadConversations();
    }
    provider.loadMessages(widget.conversationId);
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) return;
    final shouldShow = _scrollController.offset > _jumpToLatestThreshold;
    if (shouldShow == _showJumpToLatest) return;
    setState(() {
      _showJumpToLatest = shouldShow;
      if (!shouldShow) _messagesWhileAway = 0;
    });
  }

  /// Reage a cada notificacao do provider: marca mensagens ja vistas, conta as
  /// que chegaram enquanto o usuario estava longe do fim e trata o deep link.
  void _handleProviderUpdate() {
    final provider = _provider;
    if (provider == null || !mounted) return;
    final messages = provider.messages;

    if (!_hasCompletedFirstLoad) {
      if (messages.isNotEmpty) {
        _hasCompletedFirstLoad = true;
        _seenMessageIds.addAll(messages.map((message) => message.id));
      }
    } else {
      final currentUserId = context.read<AuthProvider>().currentUser?.id;
      var arrived = 0;
      for (final message in messages) {
        final isNew = _seenMessageIds.add(message.id);
        final isMine = message.isMine ||
            (currentUserId != null && message.senderId == currentUserId);
        if (isNew && !isMine) arrived++;
      }
      if (arrived > 0 && _showJumpToLatest) {
        setState(() => _messagesWhileAway += arrived);
      }
    }

    _scrollToTargetMessage(messages);
  }

  void _jumpToLatest() {
    if (_scrollController.hasClients) {
      if (MediaQuery.disableAnimationsOf(context)) {
        _scrollController.jumpTo(0);
      } else {
        _scrollController.animateTo(
          0,
          duration: AppDurations.normal,
          curve: AppCurves.exit,
        );
      }
    }
    if (_messagesWhileAway != 0 || _showJumpToLatest) {
      setState(() {
        _messagesWhileAway = 0;
        _showJumpToLatest = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    if (_isSending || context.read<ChatProvider>().isSending) return;
    setState(() => _isSending = true);
    late final bool sent;
    try {
      sent = await context
          .read<ChatProvider>()
          .sendMessage(widget.conversationId, _controller.text);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
    if (!mounted) return;
    if (sent) {
      _controller.clear();
      _jumpToLatest();
    }
  }

  Future<void> _showEditDialog(Message message) async {
    final editController = TextEditingController(text: message.content);
    final provider = context.read<ChatProvider>();
    var isSaving = false;
    final updated = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Editar mensagem'),
          content: TextField(
            controller: editController,
            autofocus: true,
            minLines: 1,
            maxLines: 4,
            decoration: const InputDecoration(hintText: 'Digite a mensagem'),
          ),
          actions: [
            TextButton(
              onPressed:
                  isSaving ? null : () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      setDialogState(() => isSaving = true);
                      final saved = await provider.editMessage(
                        message.id,
                        editController.text,
                      );
                      if (context.mounted) Navigator.of(context).pop(saved);
                    },
              child: isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Salvar'),
            ),
          ],
        ),
      ),
    );
    editController.dispose();
    if (updated == false && mounted) {
      _showSnackBar('Não foi possível editar a mensagem.');
    }
  }

  Future<void> _showDeleteDialog(Message message) async {
    final provider = context.read<ChatProvider>();
    var isDeleting = false;
    final deleted = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Excluir mensagem'),
          content: const Text(
            'Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.',
          ),
          actions: [
            TextButton(
              onPressed:
                  isDeleting ? null : () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
              onPressed: isDeleting
                  ? null
                  : () async {
                      setDialogState(() => isDeleting = true);
                      final deleted = await provider.deleteMessage(message.id);
                      if (context.mounted) Navigator.of(context).pop(deleted);
                    },
              icon: isDeleting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.delete_outline, size: 18),
              label: const Text('Excluir'),
            ),
          ],
        ),
      ),
    );
    if (deleted == false && mounted) {
      _showSnackBar('Não foi possível excluir a mensagem.');
    }
  }

  void _showSnackBar(String message) {
    AppSnackbar.showError(context, message);
  }

  /// Duas mensagens seguidas do mesmo remetente, no mesmo dia e a menos de
  /// cinco minutos formam um grupo.
  static const Duration _groupWindow = Duration(minutes: 5);

  bool _continuesGroup(List<Message> messages, int index) {
    if (index <= 0) return false;
    final current = messages[index];
    final previous = messages[index - 1];
    if (current.senderId != previous.senderId) return false;
    if (_shouldShowDateDivider(messages, index)) return false;
    final gap = current.sentAt.difference(previous.sentAt);
    // gap negativo indica horario invalido vindo da API; nesse caso nao agrupa.
    if (gap.isNegative) return false;
    return gap <= _groupWindow;
  }

  BubbleGroupPosition _groupPosition(List<Message> messages, int index) {
    final continuesPrevious = _continuesGroup(messages, index);
    final continuedByNext =
        index + 1 < messages.length && _continuesGroup(messages, index + 1);

    if (continuesPrevious && continuedByNext) return BubbleGroupPosition.middle;
    if (continuesPrevious) return BubbleGroupPosition.last;
    if (continuedByNext) return BubbleGroupPosition.first;
    return BubbleGroupPosition.single;
  }

  bool _shouldShowDateDivider(List<Message> messages, int index) {
    if (index == 0) return true;
    final current = messages[index].sentAt;
    final previous = messages[index - 1].sentAt;
    return current.year != previous.year ||
        current.month != previous.month ||
        current.day != previous.day;
  }

  String _formatDay(DateTime value) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDay = DateTime(value.year, value.month, value.day);
    if (messageDay == today) return 'Hoje';
    if (messageDay == today.subtract(const Duration(days: 1))) return 'Ontem';
    return '${value.day.toString().padLeft(2, '0')}/'
        '${value.month.toString().padLeft(2, '0')}/${value.year}';
  }

  GlobalKey _messageKey(String messageId) {
    return _messageKeys.putIfAbsent(messageId, GlobalKey.new);
  }

  void _scrollToTargetMessage(List<Message> messages) {
    final targetMessageId = widget.targetMessageId;
    if (targetMessageId == null ||
        targetMessageId.isEmpty ||
        _lastScrolledTargetMessageId == targetMessageId ||
        !messages.any((message) => message.id == targetMessageId)) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final targetContext = _messageKeys[targetMessageId]?.currentContext;
      if (targetContext == null) return;
      Scrollable.ensureVisible(
        targetContext,
        duration: MediaQuery.disableAnimationsOf(context)
            ? AppDurations.instant
            : AppDurations.normal,
        curve: AppCurves.enter,
        alignment: 0.45,
      );
      _lastScrolledTargetMessageId = targetMessageId;
    });
  }

  String _conversationTitle(ChatProvider provider) {
    final explicitTitle = widget.conversationTitle?.trim();
    if (explicitTitle != null && explicitTitle.isNotEmpty) return explicitTitle;

    for (final conversation in provider.conversations) {
      if (conversation.id == widget.conversationId) {
        return conversation.title;
      }
    }

    return 'Conversa';
  }

  String? _conversationAvatarUrl(ChatProvider provider) {
    for (final conversation in provider.conversations) {
      if (conversation.id == widget.conversationId) {
        return conversation.avatarUrl;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.watch<AuthProvider>().currentUser?.id;
    return Consumer<ChatProvider>(
      builder: (context, provider, _) {
        final colorScheme = Theme.of(context).colorScheme;
        final conversationTitle = _conversationTitle(provider);
        final avatarUrl = _conversationAvatarUrl(provider);
        final conversationBackground =
            Theme.of(context).brightness == Brightness.light
                ? AppColors.surfaceTint
                : AppColors.darkBackground;
        final isSending = _isSending || provider.isSending;

        return Scaffold(
          backgroundColor: conversationBackground,
          appBar: AppBar(
            backgroundColor: AppColors.primaryDark,
            foregroundColor: AppColors.surface,
            surfaceTintColor: AppColors.primaryDark,
            iconTheme: const IconThemeData(color: AppColors.surface),
            toolbarHeight: 72,
            titleSpacing: 0,
            title: Row(
              children: [
                AppAvatar(
                  name: conversationTitle,
                  imageUrl: avatarUrl,
                  radius: 20,
                  backgroundColor: AppColors.surface,
                  foregroundColor: AppColors.primaryDark,
                  initials: conversationTitle.isEmpty ? 'C' : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conversationTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppColors.surface,
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Conversa acadêmica',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.surface.withValues(alpha: 0.78),
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
              ],
            ),
          ),
          body: SafeArea(
            // O ChatInputBar ja tem o proprio SafeArea(top: false) e a AppBar
            // cuida do topo.
            top: false,
            bottom: false,
            child: Column(
              children: [
                if (provider.errorMessage != null &&
                    provider.messages.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colorScheme.errorContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        provider.errorMessage!,
                        style: TextStyle(color: colorScheme.onErrorContainer),
                      ),
                    ),
                  ),
                Expanded(
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: provider.isLoading && provider.messages.isEmpty
                            ? const MessageListSkeleton()
                            : provider.errorMessage != null &&
                                    provider.messages.isEmpty
                                ? AppErrorState(
                                    message: provider.errorMessage!,
                                    onRetry: () => provider.loadMessages(
                                      widget.conversationId,
                                    ),
                                  )
                                : provider.messages.isEmpty
                                    ? const EmptyState(
                                        title: 'Nenhuma mensagem',
                                        subtitle:
                                            'Envie a primeira mensagem desta conversa.',
                                      )
                                    : ListView.builder(
                                        // Lista invertida: abre ancorada na mensagem
                                        // mais recente e mensagens novas entram na base
                                        // sem deslocar o que esta sendo lido.
                                        reverse: true,
                                        controller: _scrollController,
                                        keyboardDismissBehavior:
                                            ScrollViewKeyboardDismissBehavior
                                                .onDrag,
                                        padding: const EdgeInsets.fromLTRB(
                                          AppSpacing.lg,
                                          AppSpacing.md,
                                          AppSpacing.lg,
                                          AppSpacing.md,
                                        ),
                                        itemCount: provider.messages.length,
                                        itemBuilder: (context, index) {
                                          final messageIndex =
                                              provider.messages.length -
                                                  1 -
                                                  index;
                                          final message =
                                              provider.messages[messageIndex];
                                          final isMine = message.isMine ||
                                              message.senderId == currentUserId;
                                          final isTarget = message.id ==
                                              widget.targetMessageId;
                                          return Column(
                                            key: message.id.isEmpty
                                                ? null
                                                : _messageKey(message.id),
                                            crossAxisAlignment:
                                                CrossAxisAlignment.stretch,
                                            children: [
                                              if (_shouldShowDateDivider(
                                                  provider.messages,
                                                  messageIndex))
                                                _DateDivider(
                                                    label: _formatDay(
                                                        message.sentAt)),
                                              AnimatedContainer(
                                                duration: AppDurations.normal,
                                                curve: AppCurves.standard,
                                                decoration: BoxDecoration(
                                                  border: isTarget
                                                      ? Border.all(
                                                          color:
                                                              AppColors.accent,
                                                          width: 1.4,
                                                        )
                                                      : null,
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                ),
                                                padding: isTarget
                                                    ? const EdgeInsets
                                                        .symmetric(
                                                        horizontal: 4,
                                                      )
                                                    : EdgeInsets.zero,
                                                child: MessageBubble(
                                                  message: message,
                                                  currentUserId: currentUserId,
                                                  groupPosition: _groupPosition(
                                                    provider.messages,
                                                    messageIndex,
                                                  ),
                                                  onEdit: isMine
                                                      ? () => _showEditDialog(
                                                          message)
                                                      : null,
                                                  onDelete: isMine
                                                      ? () => _showDeleteDialog(
                                                          message)
                                                      : null,
                                                ),
                                              ),
                                            ],
                                          );
                                        },
                                      ),
                      ),
                      Positioned(
                        right: AppSpacing.lg,
                        bottom: AppSpacing.md,
                        child: _JumpToLatestButton(
                          key: const ValueKey('chat-jump-to-latest'),
                          visible: _showJumpToLatest,
                          newMessageCount: _messagesWhileAway,
                          onPressed: _jumpToLatest,
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 10),
                  child: Stack(
                    alignment: Alignment.centerRight,
                    children: [
                      AbsorbPointer(
                        absorbing: isSending,
                        child: ChatInputBar(
                          controller: _controller,
                          onSend: _sendMessage,
                        ),
                      ),
                      if (isSending)
                        Positioned(
                          right: 5,
                          child: Container(
                            width: 48,
                            height: 48,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: colorScheme.onPrimary,
                              ),
                            ),
                          ),
                        ),
                    ],
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

/// Pilula discreta para voltar a mensagem mais recente. Aparece so quando o
/// usuario esta longe do fim; mostra quantas mensagens chegaram nesse meio
/// tempo. Nao e um FAB de proposito: um FAB aqui seria enfeite de template.
class _JumpToLatestButton extends StatelessWidget {
  const _JumpToLatestButton({
    super.key,
    required this.visible,
    required this.newMessageCount,
    required this.onPressed,
  });

  final bool visible;
  final int newMessageCount;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final hasCount = newMessageCount > 0;
    final label = hasCount
        ? '$newMessageCount ${newMessageCount == 1 ? 'nova mensagem' : 'novas mensagens'}'
        : 'Ir para a mensagem mais recente';

    final button = Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: colorScheme.surface,
        shape: StadiumBorder(
          side: BorderSide(color: colorScheme.outlineVariant),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44, minWidth: 44),
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: hasCount ? AppSpacing.md : AppSpacing.sm,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (hasCount) ...[
                    Text(
                      newMessageCount > 99 ? '99+' : '$newMessageCount',
                      style: TextStyle(
                        color: colorScheme.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                  ],
                  Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 22,
                    color: colorScheme.primary,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    if (reduceMotion) {
      return visible ? button : const SizedBox.shrink();
    }

    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedSlide(
        offset: visible ? Offset.zero : const Offset(0, 0.4),
        duration: AppDurations.fast,
        curve: AppCurves.standard,
        child: AnimatedOpacity(
          opacity: visible ? 1 : 0,
          duration: AppDurations.fast,
          curve: AppCurves.standard,
          child: button,
        ),
      ),
    );
  }
}

class _DateDivider extends StatelessWidget {
  const _DateDivider({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            child: Text(
              label,
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
