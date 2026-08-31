import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/core/utils/date_utils.dart';
import 'package:tcc_mobile/models/conversation.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/chat_provider.dart';
import 'package:tcc_mobile/screens/chat/chat_list_screen.dart';
import 'package:tcc_mobile/widgets/chat/conversation_tile.dart';
import 'package:tcc_mobile/widgets/common/app_skeletons.dart';

class FakeAuthProvider extends AuthProvider {
  FakeAuthProvider() {
    currentUser = const User(id: '1', name: 'Usuario Teste', email: 'u@x.com');
    token = 'header.payload.signature';
  }

  @override
  Future<void> checkAuth() async {}
}

class FakeChatProvider extends ChatProvider {
  FakeChatProvider({List<Conversation> seed = const []}) {
    conversations.addAll(seed);
    hasLoadedConversations = true;
  }

  final Completer<void> contactsCompleter = Completer<void>();
  int loadConversationsCalls = 0;
  int loadContactsCalls = 0;

  @override
  Future<void> loadConversations() async {
    loadConversationsCalls++;
    hasLoadedConversations = true;
    notifyListeners();
  }

  @override
  Future<void> loadContacts(String? currentUserId) async {
    loadContactsCalls++;
    isLoadingContacts = true;
    notifyListeners();
    await contactsCompleter.future;
    isLoadingContacts = false;
    notifyListeners();
  }
}

Conversation _conversation({
  required String id,
  required String title,
  String lastMessage = 'ultima mensagem',
  int unreadCount = 0,
  Duration age = Duration.zero,
}) {
  return Conversation(
    id: id,
    title: title,
    lastMessage: lastMessage,
    lastUpdated: DateTime.now().subtract(age),
    unreadCount: unreadCount,
  );
}

Future<void> _pumpChatList(
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
        home: const ChatListScreen(),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  group('DateUtilsX.conversationTimestamp', () {
    final now = DateTime(2026, 8, 31, 15, 30);

    test('mostra a hora quando a mensagem e do mesmo dia', () {
      expect(
        DateUtilsX.conversationTimestamp(DateTime(2026, 8, 31, 9, 5), now: now),
        '09:05',
      );
    });

    test('mostra Ontem no dia anterior', () {
      expect(
        DateUtilsX.conversationTimestamp(DateTime(2026, 8, 30, 23, 0), now: now),
        'Ontem',
      );
    });

    test('mostra o dia da semana dentro da ultima semana', () {
      // 2026-08-27 e uma quinta-feira.
      expect(
        DateUtilsX.conversationTimestamp(DateTime(2026, 8, 27, 10, 0), now: now),
        'qui',
      );
    });

    test('mostra a data curta acima de uma semana', () {
      expect(
        DateUtilsX.conversationTimestamp(DateTime(2026, 7, 4, 10, 0), now: now),
        '04/07/26',
      );
    });
  });

  testWidgets('lista mostra nome, previa, horario e nao lidas', (tester) async {
    final chat = FakeChatProvider(
      seed: [
        _conversation(
          id: '1',
          title: 'Danilo',
          lastMessage: 'bom dia',
          unreadCount: 3,
        ),
      ],
    );
    await _pumpChatList(tester, chat: chat);

    expect(find.text('Danilo'), findsOneWidget);
    expect(find.text('bom dia'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
    expect(find.byType(ConversationTile), findsOneWidget);
  });

  testWidgets('a tela nao repete a carga ja feita pelo shell', (tester) async {
    final chat = FakeChatProvider(seed: [_conversation(id: '1', title: 'A')]);
    await _pumpChatList(tester, chat: chat);

    expect(chat.loadConversationsCalls, 0);
  });

  testWidgets('busca filtra em tempo real e o botao limpa o campo',
      (tester) async {
    final chat = FakeChatProvider(
      seed: [
        _conversation(id: '1', title: 'Danilo', lastMessage: 'ola'),
        _conversation(id: '2', title: 'IA generativa', lastMessage: 'teste'),
      ],
    );
    await _pumpChatList(tester, chat: chat);

    await tester.enterText(find.byType(TextField), 'gener');
    await tester.pumpAndSettle();

    expect(find.text('IA generativa'), findsOneWidget);
    expect(find.text('Danilo'), findsNothing);

    await tester.tap(find.byTooltip('Limpar busca'));
    await tester.pumpAndSettle();

    expect(find.text('Danilo'), findsOneWidget);
    expect(find.text('IA generativa'), findsOneWidget);
  });

  testWidgets('busca sem resultado mostra estado proprio', (tester) async {
    final chat = FakeChatProvider(seed: [_conversation(id: '1', title: 'Ana')]);
    await _pumpChatList(tester, chat: chat);

    await tester.enterText(find.byType(TextField), 'zzz');
    await tester.pumpAndSettle();

    expect(find.text('Nenhum resultado encontrado'), findsOneWidget);
  });

  testWidgets('lista vazia oferece acao de nova conversa', (tester) async {
    final chat = FakeChatProvider();
    await _pumpChatList(tester, chat: chat);
    await tester.pumpAndSettle();

    expect(find.text('Nenhuma conversa ainda'), findsOneWidget);
    expect(find.text('Nova conversa'), findsWidgets);
  });

  testWidgets('botao de nova conversa abre a folha sem esperar a rede',
      (tester) async {
    final chat = FakeChatProvider(seed: [_conversation(id: '1', title: 'Ana')]);
    await _pumpChatList(tester, chat: chat);

    await tester.tap(find.byTooltip('Nova conversa'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // A carga de contatos ainda esta pendente e a folha ja esta na tela.
    expect(chat.contactsCompleter.isCompleted, isFalse);
    expect(chat.loadContactsCalls, 1);
    expect(find.text('Contatos'), findsOneWidget);
    expect(find.byType(ListItemSkeleton), findsWidgets);

    chat.contactsCompleter.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  });

  testWidgets('o botao fica desabilitado enquanto a folha abre',
      (tester) async {
    final chat = FakeChatProvider(seed: [_conversation(id: '1', title: 'Ana')]);
    await _pumpChatList(tester, chat: chat);

    IconButton newConversationButton() => tester.widget<IconButton>(
          find.descendant(
            of: find.byTooltip('Nova conversa'),
            matching: find.byType(IconButton),
          ),
        );

    expect(newConversationButton().onPressed, isNotNull);

    await tester.tap(find.byTooltip('Nova conversa'));
    await tester.pump();

    // Segundo toque no mesmo ponto nao dispara nada: o botao esta ocupado.
    expect(newConversationButton().onPressed, isNull);
    expect(chat.loadContactsCalls, 1);

    await tester.pump(const Duration(milliseconds: 300));
    chat.contactsCompleter.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  });

  for (final width in <double>[320, 360, 390, 430]) {
    testWidgets('lista de conversas nao transborda em $width px',
        (tester) async {
      await tester.binding.setSurfaceSize(Size(width, 720));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final chat = FakeChatProvider(
        seed: [
          _conversation(
            id: '1',
            title: 'Coordenacao do trabalho de conclusao de curso',
            lastMessage:
                'Uma previa bem longa de mensagem para forcar o corte do '
                'texto na linha da conversa.',
            unreadCount: 128,
          ),
          _conversation(id: '2', title: 'Danilo', age: const Duration(days: 9)),
        ],
      );

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
            home: const ChatListScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.byType(ConversationTile), findsNWidgets(2));
    });
  }

  testWidgets('linha inteira e clicavel e some enquanto abre', (tester) async {
    var taps = 0;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: ConversationTile(
            conversation: _conversation(id: '1', title: 'Ana'),
            onTap: () => taps++,
          ),
        ),
      ),
    );

    // Toque na extremidade direita da linha, longe do avatar e do texto.
    final tile = tester.getRect(find.byType(ConversationTile));
    await tester.tapAt(Offset(tile.right - 8, tile.center.dy));
    await tester.pumpAndSettle();

    expect(taps, 1);
    expect(tile.height, greaterThanOrEqualTo(64));
  });
}

