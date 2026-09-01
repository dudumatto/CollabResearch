import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/widgets/notifications/notification_presentation.dart';

void main() {
  group('titulo da notificacao', () {
    /// Linha real de notificacao vinda do backend com o dev_seed aplicado.
    /// O DTO nao tem campo de titulo; payload_resumo carrega metadados.
    Map<String, dynamic> doBackend({String? titulo}) => <String, dynamic>{
          'id': 3,
          'mensagem': 'Sua inscricao esta pendente de avaliacao.',
          'tipo': 'INSCRICAO_RECEBIDA',
          'entidadeRelacionada': 'inscricao',
          'idEntidadeRelacionada': 1,
          'rotaSugerida': '/app/applications',
          'payloadResumo': '{"seed":"dev"}',
          'lida': false,
          if (titulo != null) 'title': titulo,
        };

    test('payloadResumo nao vira titulo', () {
      final notification = AppNotification.fromJson(doBackend());

      expect(notification.title, isNot(contains('seed')));
      expect(notification.title, isNot(contains('{')));
    });

    test('a tela mostra o rotulo legivel do tipo', () {
      final notification = AppNotification.fromJson(doBackend());
      final presentation = NotificationPresentation.of(notification.type);

      expect(presentation.titleFor(notification), 'Nova inscrição recebida');
    });

    test('a mensagem do backend continua sendo a descricao', () {
      final notification = AppNotification.fromJson(doBackend());

      expect(notification.description, 'Sua inscricao esta pendente de avaliacao.');
    });

    test('um titulo de verdade do backend tem prioridade', () {
      final notification =
          AppNotification.fromJson(doBackend(titulo: 'Inscricao no projeto X'));
      final presentation = NotificationPresentation.of(notification.type);

      expect(presentation.titleFor(notification), 'Inscricao no projeto X');
    });
  });
}
