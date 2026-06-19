import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/config/env.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../services/chat_service.dart';
import '../services/stomp_service.dart';

class ChatProvider extends ChangeNotifier {
  final ChatService _service = ChatService();
  final List<Conversation> conversations = <Conversation>[];
  final List<Message> messages = <Message>[];
  StompService? _stompService;
  StreamSubscription<Map<String, dynamic>>? _realtimeSubscription;
  String? _activeRealtimeConversationId;
  bool isLoading = false;
  bool isSending = false;
  String? errorMessage;

  Future<void> loadConversations() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedConversations = await _service.conversations();
      conversations
        ..clear()
        ..addAll(loadedConversations);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar as conversas.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMessages(String conversationId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final loadedMessages = await _service.messages(conversationId);
      messages
        ..clear()
        ..addAll(loadedMessages);
      await _connectRealtime(conversationId);
    } catch (_) {
      errorMessage = 'Nao foi possivel carregar as mensagens.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> sendMessage(String conversationId, String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return false;
    isSending = true;
    errorMessage = null;
    notifyListeners();
    try {
      final message = await _service.sendMessage(conversationId, trimmed);
      _upsertMessage(message);
      return true;
    } catch (_) {
      errorMessage = 'Nao foi possivel enviar a mensagem.';
      return false;
    } finally {
      isSending = false;
      notifyListeners();
    }
  }

  Future<bool> editMessage(String messageId, String content) async {
    final trimmed = content.trim();
    if (messageId.isEmpty || trimmed.isEmpty) return false;
    errorMessage = null;
    notifyListeners();
    try {
      final updatedMessage = await _service.editMessage(messageId, trimmed);
      _upsertMessage(updatedMessage);
      notifyListeners();
      return true;
    } catch (_) {
      errorMessage = 'Nao foi possivel editar a mensagem.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteMessage(String messageId) async {
    if (messageId.isEmpty) return false;
    errorMessage = null;
    notifyListeners();
    try {
      await _service.deleteMessage(messageId);
      messages.removeWhere((message) => message.id == messageId);
      notifyListeners();
      return true;
    } catch (_) {
      errorMessage = 'Nao foi possivel excluir a mensagem.';
      notifyListeners();
      return false;
    }
  }

  Future<void> _connectRealtime(String conversationId) async {
    if (_activeRealtimeConversationId == conversationId &&
        _stompService != null) {
      return;
    }

    await _realtimeSubscription?.cancel();
    _stompService?.dispose();
    _realtimeSubscription = null;
    _stompService = null;
    _activeRealtimeConversationId = null;

    final token = await ApiClient.instance.readToken();
    if (token == null || token.isEmpty) return;

    final stompService = StompService(
      wsUrl: _buildWsUrl(),
      token: token,
    );
    _realtimeSubscription = stompService.events.listen(_handleRealtimeEvent);
    stompService.connectToConversation(conversationId);
    _stompService = stompService;
    _activeRealtimeConversationId = conversationId;
  }

  void _handleRealtimeEvent(Map<String, dynamic> event) {
    final type = '${event['tipo'] ?? event['type'] ?? ''}';

    if (type == 'MENSAGEM_CRIADA' && event['mensagem'] is Map) {
      _upsertMessage(Message.fromJson(
        Map<String, dynamic>.from(event['mensagem'] as Map),
      ));
      notifyListeners();
      return;
    }

    if (type == 'MENSAGEM_EDITADA' && event['mensagem'] is Map) {
      _upsertMessage(Message.fromJson(
        Map<String, dynamic>.from(event['mensagem'] as Map),
      ));
      notifyListeners();
      return;
    }

    if (type == 'MENSAGEM_EXCLUIDA') {
      final messageId = '${event['mensagemId'] ?? event['messageId'] ?? ''}';
      messages.removeWhere((message) => message.id == messageId);
      notifyListeners();
    }
  }

  void _upsertMessage(Message message) {
    final index = messages.indexWhere((item) => item.id == message.id);
    if (index == -1) {
      messages.add(message);
      messages.sort((a, b) => a.sentAt.compareTo(b.sentAt));
      return;
    }
    messages[index] = message;
  }

  String _buildWsUrl() {
    final apiBase = Env.apiUrl.replaceFirst(RegExp(r'/api/?$'), '');
    final wsBase = apiBase.replaceFirstMapped(
      RegExp(r'^https?', caseSensitive: false),
      (match) => match.group(0)!.toLowerCase() == 'https' ? 'wss' : 'ws',
    );
    return '${wsBase.replaceFirst(RegExp(r'/$'), '')}/ws';
  }

  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    _stompService?.dispose();
    super.dispose();
  }
}
