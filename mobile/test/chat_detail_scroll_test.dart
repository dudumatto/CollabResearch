import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/message.dart';

import 'support/chat_test_doubles.dart';

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
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('Mensagem 29'), findsOneWidget);
    expect(find.text('Mensagem 0'), findsNothing);
  });

  testWidgets('a pilula de ir ao fim so aparece longe da ultima mensagem',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await pumpChatDetail(tester, chat: chat);

    expect(_jumpButtonOpacity(tester), 0);

    // Lista invertida: arrastar para baixo revela mensagens mais antigas.
    await tester.drag(find.byType(ListView), const Offset(0, 600));
    await tester.pumpAndSettle();

    expect(_jumpButtonOpacity(tester), 1);
  });

  testWidgets('voltar ao fim esconde a pilula e mostra a ultima mensagem',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await pumpChatDetail(tester, chat: chat);

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

  testWidgets('mensagem recebida longe do fim vira contador na pilula',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await pumpChatDetail(tester, chat: chat);

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

  testWidgets('mensagem propria nao conta como nao lida na pilula',
      (tester) async {
    final chat = FakeChatProvider(seed: _history(30));
    await pumpChatDetail(tester, chat: chat);

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
