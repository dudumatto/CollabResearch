import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../models/message.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/chat_input_bar.dart';
import '../../widgets/chat/message_bubble.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';

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
    final sent = await context
        .read<ChatProvider>()
        .sendMessage(widget.conversationId, _controller.text);
    if (sent) {
      _controller.clear();
    }
  }

  Future<void> _showEditDialog(Message message) async {
    final editController = TextEditingController(text: message.content);
    final provider = context.read<ChatProvider>();
    final updated = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
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
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              final saved =
                  await provider.editMessage(message.id, editController.text);
              if (context.mounted) Navigator.of(context).pop(saved);
            },
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
    editController.dispose();
    if (updated == false && mounted) {
      _showSnackBar('Nao foi possivel editar a mensagem.');
    }
  }

  Future<void> _showDeleteDialog(Message message) async {
    final provider = context.read<ChatProvider>();
    final deleted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excluir mensagem'),
        content: const Text(
          'Tem certeza que deseja excluir esta mensagem? Esta acao nao pode ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              final deleted = await provider.deleteMessage(message.id);
              if (context.mounted) Navigator.of(context).pop(deleted);
            },
            icon: const Icon(Icons.delete_outline, size: 18),
            label: const Text('Excluir'),
          ),
        ],
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

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.watch<AuthProvider>().currentUser?.id;
    return Consumer<ChatProvider>(
      builder: (context, provider, _) {
        _scrollToTargetMessage(provider.messages);
        return Scaffold(
          appBar: AppBar(title: Text(_conversationTitle(provider))),
          body: Column(
            children: [
              if (provider.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Text(
                    provider.errorMessage!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
              Expanded(
                child: provider.isLoading && provider.messages.isEmpty
                    ? const LoadingIndicator(label: 'Carregando mensagens...')
                    : provider.messages.isEmpty
                        ? const EmptyState(
                            title: 'Nenhuma mensagem',
                            subtitle:
                                'Envie a primeira mensagem desta conversa.',
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
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
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  if (_shouldShowDateDivider(
                                      provider.messages, index))
                                    _DateDivider(
                                        label: _formatDay(message.sentAt)),
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    decoration: BoxDecoration(
                                      border: isTarget
                                          ? Border.all(
                                              color: AppColors.accent,
                                              width: 1.4,
                                            )
                                          : null,
                                      borderRadius: BorderRadius.circular(12),
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
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ChatInputBar(
                  controller: _controller,
                  onSend: provider.isSending ? () {} : _sendMessage,
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.muted,
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
