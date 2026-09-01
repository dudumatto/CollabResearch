import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/widgets/notifications/notification_presentation.dart';

/// Os 10 valores reais de TipoNotificacao no backend.
const _allTypes = [
  'SOLICITACAO_ORIENTACAO',
  'PROJETO_ACEITO',
  'PROJETO_REJEITADO',
  'INSCRICAO_RECEBIDA',
  'INSCRICAO_APROVADA',
  'INSCRICAO_REJEITADA',
  'MENSAGEM_RECEBIDA',
  'PROGRESSO_REGISTRADO',
  'PRAZO_PROXIMO',
  'PRAZO_ATRASADO',
];

AppNotification _notification({
  required String type,
  String? title,
}) {
  return AppNotification(
    id: '1',
    // Reproduz o fallback do model: sem titulo do servidor, title == type.
    title: title ?? type,
    description: 'Descrição',
    createdAt: DateTime(2026, 8, 31, 10),
    type: type,
  );
}

void main() {
  test('todos os tipos do backend tem apresentacao propria', () {
    for (final type in _allTypes) {
      final presentation = NotificationPresentation.of(type);
      expect(presentation.title, isNotEmpty, reason: type);
      expect(presentation.label, isNotEmpty, reason: type);
      // Nenhum tipo conhecido pode cair no titulo generico do desconhecido.
      expect(presentation.title, isNot('Notificação'), reason: type);
    }
  });

  test('tipo desconhecido cai no padrao neutro', () {
    final presentation = NotificationPresentation.of('COISA_NOVA');
    expect(presentation.title, 'Notificação');
    expect(presentation.label, 'Aviso');
    expect(presentation.severity, NotificationSeverity.neutral);
  });

  test('tipo vazio tambem cai no padrao', () {
    expect(
      NotificationPresentation.of('').severity,
      NotificationSeverity.neutral,
    );
  });

  test('aprovado e recusado nao podem parecer a mesma coisa', () {
    // Era exatamente este o bug: os dois caiam em verde com icone de pasta.
    final accepted = NotificationPresentation.of('PROJETO_ACEITO');
    final rejected = NotificationPresentation.of('PROJETO_REJEITADO');

    expect(accepted.severity, NotificationSeverity.positive);
    expect(rejected.severity, NotificationSeverity.negative);
    expect(accepted.icon, isNot(rejected.icon));

    final approved = NotificationPresentation.of('INSCRICAO_APROVADA');
    final denied = NotificationPresentation.of('INSCRICAO_REJEITADA');
    expect(approved.severity, isNot(denied.severity));
    expect(approved.icon, isNot(denied.icon));
  });

  test('prazo proximo e prazo atrasado se distinguem', () {
    expect(
      NotificationPresentation.of('PRAZO_PROXIMO').severity,
      NotificationSeverity.urgent,
    );
    expect(
      NotificationPresentation.of('PRAZO_ATRASADO').severity,
      NotificationSeverity.negative,
    );
  });

  test('mensagem recebida e informativa, nao alerta', () {
    final presentation = NotificationPresentation.of('MENSAGEM_RECEBIDA');
    expect(presentation.severity, NotificationSeverity.info);
    expect(presentation.label, 'Mensagem');
  });

  group('titleFor', () {
    test('usa o titulo legivel quando o servidor manda o nome do enum', () {
      final presentation = NotificationPresentation.of('PRAZO_ATRASADO');
      expect(
        presentation.titleFor(_notification(type: 'PRAZO_ATRASADO')),
        'Prazo atrasado',
      );
    });

    test('usa o titulo legivel quando o servidor nao manda nada', () {
      final presentation = NotificationPresentation.of('PROJETO_ACEITO');
      expect(
        presentation.titleFor(
          _notification(type: 'PROJETO_ACEITO', title: '   '),
        ),
        'Projeto aceito',
      );
    });

    test('respeita um titulo de verdade vindo do servidor', () {
      final presentation = NotificationPresentation.of('PROJETO_ACEITO');
      expect(
        presentation.titleFor(
          _notification(type: 'PROJETO_ACEITO', title: 'Seu TCC foi aceito'),
        ),
        'Seu TCC foi aceito',
      );
    });
  });

  testWidgets('a cor troca entre tema claro e escuro', (tester) async {
    late Color light;
    late Color dark;
    final presentation = NotificationPresentation.of('PRAZO_ATRASADO');

    // Theme direto, sem MaterialApp: e o brightness deste Theme que o
    // mapeador consulta, e assim o teste nao depende de themeMode.
    await tester.pumpWidget(
      MaterialApp(
        home: Column(
          children: [
            Theme(
              data: ThemeData(brightness: Brightness.light),
              child: Builder(
                builder: (context) {
                  light = presentation.color(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
            Theme(
              data: ThemeData(brightness: Brightness.dark),
              child: Builder(
                builder: (context) {
                  dark = presentation.color(context);
                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );

    expect(light, isNot(dark));
  });
}
