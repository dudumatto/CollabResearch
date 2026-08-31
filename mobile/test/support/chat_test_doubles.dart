import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/chat_provider.dart';
import 'package:tcc_mobile/screens/chat/chat_detail_screen.dart';

/// Dublês compartilhados pelos testes da tela de conversa. Mantidos aqui para
/// os arquivos de teste não repetirem a mesma montagem de providers.
class FakeAuthProvider extends AuthProvider {
  FakeAuthProvider({String id = 'u1'}) {
    currentUser = User(id: id, name: 'Eu', email: 'eu@x.com');
    token = 'header.payload.signature';
  }

  @override
  Future<void> checkAuth() async {}
}

class FakeChatProvider extends ChatProvider {
  FakeChatProvider({List<Message> seed = const []}) {
    messages.addAll(seed);
  }

  int loadMessagesCalls = 0;

  @override
  Future<void> loadConversations() async {}

  @override
  Future<void> loadMessages(String conversationId) async {
    loadMessagesCalls++;
    notifyListeners();
  }

  /// Simula a chegada de uma mensagem pelo WebSocket.
  void receive(Message message) {
    messages.add(message);
    notifyListeners();
  }
}

Future<void> pumpChatDetail(
  WidgetTester tester, {
  required FakeChatProvider chat,
  Size surfaceSize = const Size(390, 844),
}) async {
  await tester.binding.setSurfaceSize(surfaceSize);
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => FakeAuthProvider()),
        ChangeNotifierProvider<ChatProvider>.value(value: chat),
      ],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        home: const ChatDetailScreen(conversationId: 'c1'),
      ),
    ),
  );
  await tester.pump();
}
