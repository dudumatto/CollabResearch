import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/widgets/notifications/notification_tile.dart';

AppNotification _notification({
  required String type,
  String? title,
  bool isRead = false,
  String description = 'A etapa Revisão venceu ontem.',
}) {
  return AppNotification(
    id: '1',
    title: title ?? type,
    description: description,
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    type: type,
    isRead: isRead,
  );
}

Future<void> _pumpTile(
  WidgetTester tester,
  AppNotification notification, {
  VoidCallback? onTap,
}) async {
  await tester.binding.setSurfaceSize(const Size(390, 400));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.lightTheme,
      home: Scaffold(
        body: NotificationTile(notification: notification, onTap: onTap),
      ),
    ),
  );
}

String _semanticsLabel(WidgetTester tester) {
  return tester
      .widget<Semantics>(
        find
            .descendant(
              of: find.byType(NotificationTile),
              matching: find.byType(Semantics),
            )
            .first,
      )
      .properties
      .label!;
}

void main() {
  testWidgets('nao mostra o nome cru do enum como titulo', (tester) async {
    await _pumpTile(tester, _notification(type: 'PRAZO_ATRASADO'));

    expect(find.text('PRAZO_ATRASADO'), findsNothing);
    expect(find.text('Prazo atrasado'), findsOneWidget);
  });

  testWidgets('mostra o titulo do servidor quando ele existe', (tester) async {
    await _pumpTile(
      tester,
      _notification(type: 'PROJETO_ACEITO', title: 'Seu TCC foi aceito'),
    );

    expect(find.text('Seu TCC foi aceito'), findsOneWidget);
    expect(find.text('Projeto aceito'), findsNothing);
  });

  testWidgets('mostra o selo do assunto', (tester) async {
    await _pumpTile(tester, _notification(type: 'MENSAGEM_RECEBIDA'));
    expect(find.text('Mensagem'), findsOneWidget);
  });

  testWidgets('lida e nao lida sao anunciadas de forma diferente',
      (tester) async {
    await _pumpTile(tester, _notification(type: 'PRAZO_PROXIMO'));
    expect(_semanticsLabel(tester), contains('Não lida'));

    await _pumpTile(
      tester,
      _notification(type: 'PRAZO_PROXIMO', isRead: true),
    );
    expect(_semanticsLabel(tester), contains('Lida'));
  });

  testWidgets('o rotulo acessivel carrega assunto, titulo e descricao',
      (tester) async {
    await _pumpTile(tester, _notification(type: 'PRAZO_ATRASADO'));
    final label = _semanticsLabel(tester);

    expect(label, contains('Prazo'));
    expect(label, contains('Prazo atrasado'));
    expect(label, contains('A etapa Revisão venceu ontem.'));
  });

  testWidgets('a linha inteira responde ao toque', (tester) async {
    var taps = 0;
    await _pumpTile(
      tester,
      _notification(type: 'INSCRICAO_APROVADA'),
      onTap: () => taps++,
    );

    await tester.tap(find.byType(NotificationTile));
    await tester.pumpAndSettle();

    expect(taps, 1);
  });

  testWidgets('nao transborda com titulo e descricao longos', (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 400));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: NotificationTile(
            notification: _notification(
              type: 'SOLICITACAO_ORIENTACAO',
              title: 'Um título absurdamente longo para forçar o corte do '
                  'texto dentro do card de notificação',
              description: 'Uma descrição igualmente longa, escrita para '
                  'ocupar várias linhas e verificar que nada estoura a '
                  'largura disponível numa tela estreita.',
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });
}
