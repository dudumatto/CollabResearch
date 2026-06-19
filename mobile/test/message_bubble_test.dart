import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/widgets/chat/message_bubble.dart';

void main() {
  testWidgets('exibe mensagem e horario', (tester) async {
    final message = Message(
      id: '1',
      content: 'Mensagem de teste',
      senderId: 'u1',
      sentAt: DateTime(2026, 6, 10, 12, 30),
      isMine: true,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: MessageBubble(message: message)),
      ),
    );

    expect(find.text('Mensagem de teste'), findsOneWidget);
    expect(find.text('12:30'), findsOneWidget);
  });

  testWidgets('exibe remetente em mensagem recebida', (tester) async {
    final message = Message(
      id: '2',
      content: 'Mensagem recebida',
      senderId: 'u2',
      senderName: 'Ana Souza',
      sentAt: DateTime(2026, 6, 10, 13, 15),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MessageBubble(message: message, currentUserId: 'u1'),
        ),
      ),
    );

    expect(find.text('Ana Souza'), findsOneWidget);
    expect(find.text('Mensagem recebida'), findsOneWidget);
    expect(find.byIcon(Icons.more_vert), findsNothing);
  });

  testWidgets('exibe acoes e status editada em mensagem propria',
      (tester) async {
    var edited = false;
    var deleted = false;
    final message = Message(
      id: '3',
      content: 'Mensagem editavel',
      senderId: 'u1',
      sentAt: DateTime(2026, 6, 10, 14),
      isEdited: true,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MessageBubble(
            message: message,
            currentUserId: 'u1',
            onEdit: () => edited = true,
            onDelete: () => deleted = true,
          ),
        ),
      ),
    );

    expect(find.text('editada'), findsOneWidget);
    expect(find.byIcon(Icons.more_vert), findsOneWidget);

    await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Editar'));
    await tester.pumpAndSettle();
    expect(edited, isTrue);

    await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Excluir'));
    expect(deleted, isTrue);
  });
}
