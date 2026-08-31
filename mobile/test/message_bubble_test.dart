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
  });

  testWidgets('segurar mensagem propria oferece editar e excluir',
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

    await tester.longPress(find.text('Mensagem editavel'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Editar'));
    await tester.pumpAndSettle();
    expect(edited, isTrue);

    await tester.longPress(find.text('Mensagem editavel'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Excluir'));
    await tester.pumpAndSettle();
    expect(deleted, isTrue);
  });

  testWidgets('segurar mensagem recebida oferece copiar, mas nao excluir',
      (tester) async {
    final message = Message(
      id: '4',
      content: 'Mensagem de outra pessoa',
      senderId: 'u2',
      senderName: 'Ana Souza',
      sentAt: DateTime(2026, 6, 10, 15),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MessageBubble(message: message, currentUserId: 'u1'),
        ),
      ),
    );

    await tester.longPress(find.text('Mensagem de outra pessoa'));
    await tester.pumpAndSettle();

    expect(find.text('Copiar'), findsOneWidget);
    expect(find.text('Editar'), findsNothing);
    expect(find.text('Excluir'), findsNothing);
  });

  group('agrupamento', () {
    Message message({required String id}) => Message(
          id: id,
          content: 'Conteudo $id',
          senderId: 'u2',
          senderName: 'Ana Souza',
          sentAt: DateTime(2026, 6, 10, 16),
        );

    Future<void> pumpAt(
      WidgetTester tester,
      BubbleGroupPosition position,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MessageBubble(
              message: message(id: '1'),
              currentUserId: 'u1',
              groupPosition: position,
            ),
          ),
        ),
      );
    }

    testWidgets('first mostra o remetente e omite o horario', (tester) async {
      await pumpAt(tester, BubbleGroupPosition.first);
      expect(find.text('Ana Souza'), findsOneWidget);
      expect(find.text('16:00'), findsNothing);
    });

    testWidgets('middle omite remetente e horario', (tester) async {
      await pumpAt(tester, BubbleGroupPosition.middle);
      expect(find.text('Ana Souza'), findsNothing);
      expect(find.text('16:00'), findsNothing);
    });

    testWidgets('last omite o remetente e mostra o horario', (tester) async {
      await pumpAt(tester, BubbleGroupPosition.last);
      expect(find.text('Ana Souza'), findsNothing);
      expect(find.text('16:00'), findsOneWidget);
    });

    testWidgets('single mostra remetente e horario', (tester) async {
      await pumpAt(tester, BubbleGroupPosition.single);
      expect(find.text('Ana Souza'), findsOneWidget);
      expect(find.text('16:00'), findsOneWidget);
    });
  });
}
