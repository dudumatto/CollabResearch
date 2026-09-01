import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/providers/notification_provider.dart';
import 'package:tcc_mobile/services/notification_service.dart';

/// Servico que carrega normalmente mas falha em qualquer acao de marcar como
/// lida. `implements` evita o construtor real, que toca no ApiClient.
class _FailingActionsService implements NotificationService {
  int listCalls = 0;

  @override
  Future<List<AppNotification>> list() async {
    listCalls++;
    return [
      AppNotification(
        id: '1',
        title: 'Prazo atrasado',
        description: 'A etapa venceu ontem.',
        createdAt: DateTime(2026, 8, 31, 10),
        type: 'PRAZO_ATRASADO',
      ),
      AppNotification(
        id: '2',
        title: 'Nova mensagem',
        description: 'Ana enviou uma mensagem.',
        createdAt: DateTime(2026, 8, 30, 9),
        type: 'MENSAGEM_RECEBIDA',
      ),
    ];
  }

  @override
  Future<void> markAllAsRead() async => throw Exception('sem rede');

  @override
  Future<AppNotification> markAsRead(String id) async =>
      throw Exception('sem rede');
}

void main() {
  test('falha ao marcar todas nao apaga a lista carregada', () async {
    final service = _FailingActionsService();
    final provider = NotificationProvider(service: service);

    await provider.loadNotifications();
    expect(provider.notifications, hasLength(2));

    await provider.markAllAsRead();

    // A lista continua na tela...
    expect(provider.notifications, hasLength(2));
    // ...e o erro de acao nao vira erro de carga, que substituiria a tela
    // inteira por um AppErrorState.
    expect(provider.errorMessage, isNull);
    expect(provider.actionErrorMessage, isNotNull);
  });

  test('falha ao marcar uma nao apaga a lista carregada', () async {
    final service = _FailingActionsService();
    final provider = NotificationProvider(service: service);

    await provider.loadNotifications();
    final marked = await provider.markAsRead('1');

    expect(marked, isFalse);
    expect(provider.notifications, hasLength(2));
    expect(provider.errorMessage, isNull);
    expect(provider.actionErrorMessage, isNotNull);
  });

  test('consumeActionError devolve e limpa a mensagem', () async {
    final service = _FailingActionsService();
    final provider = NotificationProvider(service: service);

    await provider.loadNotifications();
    await provider.markAllAsRead();

    expect(provider.consumeActionError(), isNotNull);
    expect(provider.actionErrorMessage, isNull);
    expect(provider.consumeActionError(), isNull);
  });

  test('marcar todas nao bloqueia a tela inteira com isLoading', () async {
    final service = _FailingActionsService();
    final provider = NotificationProvider(service: service);
    await provider.loadNotifications();

    final future = provider.markAllAsRead();
    // Enquanto a acao roda, a lista segue utilizavel: quem sinaliza ocupado e
    // o proprio botao, nao o carregamento global da tela.
    expect(provider.isLoading, isFalse);
    expect(provider.isMarkingAll, isTrue);
    await future;
    expect(provider.isMarkingAll, isFalse);
  });

  test('notificacoes sao ordenadas da mais recente para a mais antiga',
      () async {
    final provider = NotificationProvider(service: _FailingActionsService());
    await provider.loadNotifications();

    expect(provider.notifications.first.id, '1');
    expect(
      provider.notifications.first.createdAt
          .isAfter(provider.notifications.last.createdAt),
      isTrue,
    );
  });
}
