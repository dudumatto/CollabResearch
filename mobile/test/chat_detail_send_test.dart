import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/message.dart';

import 'support/chat_test_doubles.dart';

List<Message> _seed() => [
      Message(
        id: '1',
        content: 'Ola',
        senderId: 'u2',
        senderName: 'Ana',
        sentAt: DateTime(2026, 8, 31, 10),
      ),
    ];

void main() {
  testWidgets('campo esvazia no toque, sem esperar a rede', (tester) async {
    final chat = FakeChatProvider(seed: _seed());
    await pumpChatDetail(tester, chat: chat);

    await tester.enterText(find.byType(TextField), 'minha mensagem');
    await tester.pump();

    await tester.tap(find.byKey(const ValueKey('chat-send-idle')));
    await tester.pump();

    expect(chat.lastSentContent, 'minha mensagem');
    expect(tester.widget<TextField>(find.byType(TextField)).controller?.text,
        isEmpty);

    await tester.pumpAndSettle();
  });

  testWidgets('falha no envio restaura o texto e avisa o usuario',
      (tester) async {
    final chat = FakeChatProvider(seed: _seed())..sendSucceeds = false;
    await pumpChatDetail(tester, chat: chat);

    await tester.enterText(find.byType(TextField), 'mensagem que falha');
    await tester.pump();

    await tester.tap(find.byKey(const ValueKey('chat-send-idle')));
    await tester.pumpAndSettle();

    expect(
      tester.widget<TextField>(find.byType(TextField)).controller?.text,
      'mensagem que falha',
    );
    expect(
      find.text('Não foi possível enviar. Sua mensagem foi restaurada.'),
      findsOneWidget,
    );
  });

  testWidgets('campo vazio nao chama o envio', (tester) async {
    final chat = FakeChatProvider(seed: _seed());
    await pumpChatDetail(tester, chat: chat);

    await tester.enterText(find.byType(TextField), '   ');
    await tester.pump();

    expect(find.byKey(const ValueKey('chat-send-idle')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('chat-send-idle')));
    await tester.pump();

    expect(chat.sendMessageCalls, 0);
  });
}
