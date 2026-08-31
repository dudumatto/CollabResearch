import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../models/message.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/chat_input_bar.dart';
import '../../widgets/chat/message_bubble.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/empty_state.dart';

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
  final _controller = TextEditingController();
  final Map<String, GlobalKey> _messageKeys = <String, GlobalKey>{};
  String? _lastScrolledTargetMessageId;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ChatProvider>();
      if (provider.conversations.isEmpty) {
        provider.loadConversations();
      }
      provider.loadMessages(widget.conversationId);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ChatDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.conversationId != widget.conversationId) {
      _messageKeys.clear();
      _lastScrolledTargetMessageId = null;
      final provider = context.read<ChatProvider>();
      if (provider.conversations.isEmpty) {
        provider.loadConversations();
      }
      provider.loadMessages(widget.conversationId);
    } else if (oldWidget.targetMessageId != widget.targetMessageId) {
      _lastScrolledTargetMessageId = null;
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
      _showSnackBar('Nao foi possivel editar a mensagem.');
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
            'Tem certeza que deseja excluir esta mensagem? Esta acao nao pode ser desfeita.',
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
      _showSnackBar('Nao foi possivel excluir a mensagem.');
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
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
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
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
        _scrollToTargetMessage(provider.messages);
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
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.surface,
                  foregroundImage:
                      avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: Text(
                    conversationTitle.isEmpty
                        ? 'C'
                        : conversationTitle[0].toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primaryDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
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
          body: Column(
            children: [
              if (provider.errorMessage != null && provider.messages.isNotEmpty)
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
                child: provider.isLoading && provider.messages.isEmpty
                    ? const MessageListSkeleton()
                    : provider.errorMessage != null && provider.messages.isEmpty
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
                                keyboardDismissBehavior:
                                    ScrollViewKeyboardDismissBehavior.onDrag,
                                padding:
                                    const EdgeInsets.fromLTRB(16, 12, 16, 16),
                                itemCount: provider.messages.length,
                                itemBuilder: (context, index) {
                                  final message = provider.messages[index];
                                  final isMine = message.isMine ||
                                      message.senderId == currentUserId;
                                  final isTarget =
                                      message.id == widget.targetMessageId;
                                  return Column(
                                    key: message.id.isEmpty
                                        ? null
                                        : _messageKey(message.id),
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      if (_shouldShowDateDivider(
                                          provider.messages, index))
                                        _DateDivider(
                                            label: _formatDay(message.sentAt)),
                                      AnimatedContainer(
                                        duration:
                                            const Duration(milliseconds: 200),
                                        decoration: BoxDecoration(
                                          border: isTarget
                                              ? Border.all(
                                                  color: AppColors.accent,
                                                  width: 1.4,
                                                )
                                              : null,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        padding: isTarget
                                            ? const EdgeInsets.symmetric(
                                                horizontal: 4,
                                              )
                                            : EdgeInsets.zero,
                                        child: MessageBubble(
                                          message: message,
                                          currentUserId: currentUserId,
                                          onEdit: isMine
                                              ? () => _showEditDialog(message)
                                              : null,
                                          onDelete: isMine
                                              ? () => _showDeleteDialog(message)
                                              : null,
                                        ),
                                      ),
                                    ],
                                  );
                                },
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
        );
      },
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
