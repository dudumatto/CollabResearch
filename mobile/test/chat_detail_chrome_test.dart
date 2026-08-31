import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/conversation.dart';
import 'package:tcc_mobile/models/message.dart';

import 'support/chat_test_doubles.dart';

Conversation _conversation({required String type, String? projectTitle}) {
  return Conversation(
    id: 'c1',
    title: projectTitle ?? 'Ana Souza',
    lastMessage: 'ola',
    lastUpdated: DateTime(2026, 8, 31, 10),
    type: type,
    projectTitle: projectTitle,
  );
}

Message _message(String id) => Message(
      id: id,
      content: 'Conteudo $id',
      senderId: 'u2',
      senderName: 'Ana',
      sentAt: DateTime(2026, 8, 31, 10),
    );

void main() {
  testWidgets('conversa de grupo mostra o subtitulo do projeto',
      (tester) async {
    final chat = FakeChatProvider(seed: [_message('1')]);
    chat.conversations.add(
      _conversation(type: 'GRUPO', projectTitle: 'TCC de Redes'),
    );
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('Conversa do projeto'), findsOneWidget);
  });

  testWidgets('conversa privada nao inventa subtitulo', (tester) async {
    final chat = FakeChatProvider(seed: [_message('1')]);
    chat.conversations.add(_conversation(type: 'PRIVADA'));
    await pumpChatDetail(tester, chat: chat);

    expect(find.text('Conversa do projeto'), findsNothing);
    expect(find.text('Conversa acadêmica'), findsNothing);
  });

  testWidgets('conversa sem mensagens convida a comecar', (tester) async {
    final chat = FakeChatProvider();
    chat.conversations.add(_conversation(type: 'PRIVADA'));
    await pumpChatDetail(tester, chat: chat);
    await tester.pumpAndSettle();

    expect(find.text('Comece a conversa'), findsOneWidget);
  });

  testWidgets('banner de erro pode ser dispensado', (tester) async {
    final chat = FakeChatProvider(seed: [_message('1')]);
    chat.conversations.add(_conversation(type: 'PRIVADA'));
    await pumpChatDetail(tester, chat: chat);

    chat.errorMessage = 'Nao foi possivel carregar as mensagens.';
    chat.notifyListeners();
    await tester.pumpAndSettle();

    expect(find.text('Nao foi possivel carregar as mensagens.'), findsOneWidget);

    await tester.tap(find.byTooltip('Dispensar aviso'));
    await tester.pumpAndSettle();

    expect(find.text('Nao foi possivel carregar as mensagens.'), findsNothing);
  });

  testWidgets('erro novo volta a aparecer depois de um dispensado',
      (tester) async {
    final chat = FakeChatProvider(seed: [_message('1')]);
    chat.conversations.add(_conversation(type: 'PRIVADA'));
    await pumpChatDetail(tester, chat: chat);

    chat.errorMessage = 'Primeiro erro.';
    chat.notifyListeners();
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Dispensar aviso'));
    await tester.pumpAndSettle();

    chat.errorMessage = 'Segundo erro.';
    chat.notifyListeners();
    await tester.pumpAndSettle();

    expect(find.text('Segundo erro.'), findsOneWidget);
  });
}
