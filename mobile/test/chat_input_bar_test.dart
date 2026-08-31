import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/widgets/chat/chat_input_bar.dart';

Future<void> _pumpBar(
  WidgetTester tester, {
  required TextEditingController controller,
  required VoidCallback onSend,
  bool isSending = false,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.lightTheme,
      home: Scaffold(
        body: ChatInputBar(
          controller: controller,
          onSend: onSend,
          isSending: isSending,
        ),
      ),
    ),
  );
}

InkWell _sendButton(WidgetTester tester) {
  return tester.widget<InkWell>(
    find.descendant(
      of: find.byType(ChatInputBar),
      matching: find.byType(InkWell),
    ),
  );
}

void main() {
  testWidgets('botao de enviar fica desabilitado sem texto', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);

    await _pumpBar(tester, controller: controller, onSend: () {});

    expect(_sendButton(tester).onTap, isNull);
  });

  testWidgets('botao habilita ao digitar e desabilita ao limpar',
      (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);

    await _pumpBar(tester, controller: controller, onSend: () {});

    await tester.enterText(find.byType(TextField), 'ola');
    await tester.pump();
    expect(_sendButton(tester).onTap, isNotNull);

    await tester.enterText(find.byType(TextField), '   ');
    await tester.pump();
    expect(_sendButton(tester).onTap, isNull);
  });

  testWidgets('texto so de espaco nao habilita o envio', (tester) async {
    final controller = TextEditingController(text: '    ');
    addTearDown(controller.dispose);

    await _pumpBar(tester, controller: controller, onSend: () {});

    expect(_sendButton(tester).onTap, isNull);
  });

  testWidgets('tocar no botao dispara o envio uma vez', (tester) async {
    final controller = TextEditingController(text: 'ola');
    addTearDown(controller.dispose);
    var sends = 0;

    await _pumpBar(tester, controller: controller, onSend: () => sends++);

    await tester.tap(find.byType(InkWell));
    await tester.pump();

    expect(sends, 1);
  });

  testWidgets('enviar pelo teclado dispara o envio', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    var sends = 0;

    await _pumpBar(tester, controller: controller, onSend: () => sends++);

    await tester.enterText(find.byType(TextField), 'ola');
    await tester.pump();
    await tester.testTextInput.receiveAction(TextInputAction.send);
    await tester.pump();

    expect(sends, 1);
  });

  testWidgets('durante o envio o campo continua editavel e o botao ocupa-se',
      (tester) async {
    final controller = TextEditingController(text: 'ola');
    addTearDown(controller.dispose);
    var sends = 0;

    await _pumpBar(
      tester,
      controller: controller,
      onSend: () => sends++,
      isSending: true,
    );

    // O botao nao aceita um segundo toque enquanto envia...
    expect(_sendButton(tester).onTap, isNull);
    expect(find.byKey(const ValueKey('chat-send-busy')), findsOneWidget);

    // ...mas o campo segue aceitando texto, em vez de congelar a barra.
    await tester.enterText(find.byType(TextField), 'proxima mensagem');
    await tester.pump();
    expect(controller.text, 'proxima mensagem');
    expect(sends, 0);
  });
}
