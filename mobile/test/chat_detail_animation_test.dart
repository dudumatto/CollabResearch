import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/animation/app_animations.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/chat_provider.dart';
import 'package:tcc_mobile/screens/chat/chat_detail_screen.dart';
import 'package:tcc_mobile/widgets/chat/chat_input_bar.dart';

import 'support/chat_test_doubles.dart';

List<Message> _history(int count) {
  final base = DateTime(2026, 8, 31, 9);
  return [
    for (var index = 0; index < count; index++)
      Message(
        id: '$index',
        content: 'Mensagem $index',
        senderId: 'u2',
        senderName: 'Ana',
        sentAt: base.add(Duration(minutes: index * 10)),
      ),
  ];
}

Message _incoming(String id) => Message(
      id: id,
      content: 'Chegou $id',
      senderId: 'u2',
      senderName: 'Ana',
      sentAt: DateTime(2026, 8, 31, 20),
    );

void main() {
  testWidgets('historico nao anima ao abrir a conversa', (tester) async {
    final chat = FakeChatProvider(seed: _history(6));
    await pumpChatDetail(tester, chat: chat);
    await tester.pumpAndSettle();

    // EmptyState e AppErrorState trazem FadeSlideIn proprio, mas nenhum dos
    // dois esta em tela aqui: nada do historico deve animar.
    expect(find.byType(FadeSlideIn), findsNothing);
  });

  testWidgets('mensagem que chega depois da carga anima a entrada',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(6));
    await pumpChatDetail(tester, chat: chat);
    await tester.pumpAndSettle();

    chat.receive(_incoming('900'));
    await tester.pump();

    expect(find.byType(FadeSlideIn), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('com movimento reduzido nada anima', (tester) async {
    final chat = FakeChatProvider(seed: _history(6));
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>(
            create: (_) => FakeAuthProvider(),
          ),
          ChangeNotifierProvider<ChatProvider>.value(value: chat),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          // copyWith preserva o size real: um MediaQueryData cru zeraria a
          // largura da tela.
          home: Builder(
            builder: (context) => MediaQuery(
              data: MediaQuery.of(context).copyWith(disableAnimations: true),
              child: const ChatDetailScreen(conversationId: 'c1'),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    chat.receive(_incoming('901'));
    await tester.pumpAndSettle();

    // Escopado aos widgets do chat: o Scaffold, a rota e o Tooltip trazem
    // transicoes proprias do Flutter que nao sao responsabilidade nossa.
    expect(
      find.descendant(
        of: find.byType(FadeSlideIn),
        matching: find.byType(FadeTransition),
      ),
      findsNothing,
    );
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('chat-jump-to-latest')),
        matching: find.byType(AnimatedOpacity),
      ),
      findsNothing,
    );
    expect(
      find.descendant(
        of: find.byType(ChatInputBar),
        matching: find.byType(AnimatedSwitcher),
      ),
      findsNothing,
    );
  });
}
