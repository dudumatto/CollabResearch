import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/message.dart';

import 'support/chat_test_doubles.dart';

Message _message({
  required String id,
  required String senderId,
  required DateTime sentAt,
  String? senderName,
}) {
  return Message(
    id: id,
    content: 'Conteudo $id',
    senderId: senderId,
    senderName: senderName,
    sentAt: sentAt,
  );
}

void main() {
  testWidgets('mensagens seguidas do mesmo remetente mostram o horario uma vez',
      (tester) async {
    final base = DateTime(2026, 8, 31, 14);
    final chat = FakeChatProvider(
      seed: [
        _message(id: '1', senderId: 'u2', senderName: 'Ana', sentAt: base),
        _message(
          id: '2',
          senderId: 'u2',
          senderName: 'Ana',
          sentAt: base.add(const Duration(minutes: 1)),
        ),
        _message(
          id: '3',
          senderId: 'u2',
          senderName: 'Ana',
          sentAt: base.add(const Duration(minutes: 2)),
        ),
      ],
    );
    await pumpChatDetail(tester, chat: chat);

    // Nome so na primeira do grupo, horario so na ultima.
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('14:00'), findsNothing);
    expect(find.text('14:02'), findsOneWidget);
  });

  testWidgets('intervalo maior que cinco minutos quebra o grupo',
      (tester) async {
    final base = DateTime(2026, 8, 31, 14);
    final chat = FakeChatProvider(
      seed: [
        _message(id: '1', senderId: 'u2', senderName: 'Ana', sentAt: base),
        _message(
          id: '2',
          senderId: 'u2',
          senderName: 'Ana',
          sentAt: base.add(const Duration(minutes: 10)),
        ),
      ],
    );
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('Ana'), findsNWidgets(2));
    expect(find.text('14:00'), findsOneWidget);
    expect(find.text('14:10'), findsOneWidget);
  });

  testWidgets('troca de remetente quebra o grupo', (tester) async {
    final base = DateTime(2026, 8, 31, 14);
    final chat = FakeChatProvider(
      seed: [
        _message(id: '1', senderId: 'u2', senderName: 'Ana', sentAt: base),
        _message(
          id: '2',
          senderId: 'u1',
          sentAt: base.add(const Duration(minutes: 1)),
        ),
      ],
    );
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('14:00'), findsOneWidget);
    expect(find.text('14:01'), findsOneWidget);
  });

  testWidgets('virada de dia quebra o grupo mesmo com poucos minutos',
      (tester) async {
    final chat = FakeChatProvider(
      seed: [
        _message(
          id: '1',
          senderId: 'u2',
          senderName: 'Ana',
          sentAt: DateTime(2026, 8, 30, 23, 58),
        ),
        _message(
          id: '2',
          senderId: 'u2',
          senderName: 'Ana',
          sentAt: DateTime(2026, 8, 31, 0, 1),
        ),
      ],
    );
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('Ana'), findsNWidgets(2));
    expect(find.text('23:58'), findsOneWidget);
    expect(find.text('00:01'), findsOneWidget);
  });
}
