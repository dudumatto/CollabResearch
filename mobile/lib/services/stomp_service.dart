import 'dart:async';
import 'dart:convert';

import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';

class StompService {
  StompService({required this.wsUrl, required this.token});

  final String wsUrl;
  final String token;
  StompClient? _client;
  String? _conversationId;
  final StreamController<Map<String, dynamic>> _eventsController =
      StreamController.broadcast();

  Stream<Map<String, dynamic>> get events => _eventsController.stream;

  void connectToConversation(String conversationId) {
    _conversationId = conversationId;
    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        onConnect: _onConnect,
        onWebSocketError: (_) {},
        reconnectDelay: const Duration(seconds: 5),
        stompConnectHeaders: {'Authorization': 'Bearer $token'},
      ),
    );
    _client?.activate();
  }

  void _onConnect(StompFrame _) {
    final conversationId = _conversationId;
    if (conversationId == null || conversationId.isEmpty) return;

    _client?.subscribe(
      destination: '/topic/conversa/$conversationId',
      callback: (frame) {
        if (frame.body != null) {
          final decoded = jsonDecode(frame.body!);
          if (decoded is Map<String, dynamic>) {
            _eventsController.add(decoded);
          }
        }
      },
    );
  }

  void sendMessage(Map<String, dynamic> payload) {
    _client?.send(destination: '/app/chat.send', body: jsonEncode(payload));
  }

  void disconnect() {
    _client?.deactivate();
  }

  void dispose() {
    disconnect();
    _eventsController.close();
  }
}
