import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/chat_provider.dart';
import 'package:tcc_mobile/screens/chat/chat_detail_screen.dart';

class FakeAuthProvider extends AuthProvider {
  FakeAuthProvider() {
    currentUser = const User(id: 'u1', name: 'Eu', email: 'eu@x.com');
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

List<Message> _history(int count) {
  final base = DateTime(2026, 8, 31, 9);
  return [
    for (var index = 0; index < count; index++)
      Message(
        id: '$index',
        content: 'Mensagem $index',
        senderId: index.isEven ? 'u1' : 'u2',
        senderName: index.isEven ? null : 'Ana',
        sentAt: base.add(Duration(minutes: index * 10)),
      ),
  ];
}

Future<void> _pumpChat(
  WidgetTester tester, {
  required FakeChatProvider chat,
}) async {
  await tester.binding.setSurfaceSize(const Size(390, 844));
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

double _jumpButtonOpacity(WidgetTester tester) {
  return tester
      .widget<AnimatedOpacity>(
        find.descendant(
          of: find.byKey(const ValueKey('chat-jump-to-latest')),
          matching: find.byType(AnimatedOpacity),
        ),
      )
      .opacity;
}

void main() {
  testWidgets('abre ancorada na mensagem mais recente, nao na mais antiga',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await _pumpChat(tester, chat: chat);

    expect(find.text('Mensagem 29'), findsOneWidget);
    expect(find.text('Mensagem 0'), findsNothing);
  });

  testWidgets('a pilha de ir ao fim so aparece longe da ultima mensagem',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await _pumpChat(tester, chat: chat);

    expect(_jumpButtonOpacity(tester), 0);

    // Lista invertida: arrastar para baixo revela mensagens mais antigas.
    await tester.drag(find.byType(ListView), const Offset(0, 600));
    await tester.pumpAndSettle();

    expect(_jumpButtonOpacity(tester), 1);
  });

  testWidgets('voltar ao fim esconde a pilha e mostra a ultima mensagem',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await _pumpChat(tester, chat: chat);

    await tester.drag(find.byType(ListView), const Offset(0, 600));
    await tester.pumpAndSettle();
    expect(find.text('Mensagem 29'), findsNothing);

    await tester.tap(
      find.descendant(
        of: find.byKey(const ValueKey('chat-jump-to-latest')),
        matching: find.byType(InkWell),
      ),
    );
    await tester.pumpAndSettle();

    expect(_jumpButtonOpacity(tester), 0);
    expect(find.text('Mensagem 29'), findsOneWidget);
  });

  testWidgets('mensagem recebida longe do fim vira contador na pilha',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await _pumpChat(tester, chat: chat);

    await tester.drag(find.byType(ListView), const Offset(0, 600));
    await tester.pumpAndSettle();

    chat.receive(
      Message(
        id: '900',
        content: 'Chegou agora',
        senderId: 'u2',
        senderName: 'Ana',
        sentAt: DateTime(2026, 8, 31, 20),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1'), findsOneWidget);
  });

  testWidgets('mensagem propria nao conta como nao lida na pilha',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await _pumpChat(tester, chat: chat);

    await tester.drag(find.byType(ListView), const Offset(0, 600));
    await tester.pumpAndSettle();

    chat.receive(
      Message(
        id: '901',
        content: 'Enviada por mim',
        senderId: 'u1',
        sentAt: DateTime(2026, 8, 31, 20),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1'), findsNothing);
  });
}
