import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/api/api_endpoints.dart';

void main() {
  test('endpoints principais seguem os contratos do backend', () {
    expect(ApiEndpoints.dashboard, '/api/dashboard');
    expect(ApiEndpoints.dashboardStats, '/api/dashboard/stats');
    expect(ApiEndpoints.dashboardActivity, '/api/dashboard/activity');
    expect(ApiEndpoints.projects, '/api/projetos');
    expect(ApiEndpoints.subscriptions, '/api/inscricoes');
    expect(ApiEndpoints.notifications, '/api/notificacoes');
    expect(ApiEndpoints.chatConversations, '/api/conversas');
  });

  test('endpoints derivados usam caminhos reais do backend', () {
    expect(
        ApiEndpoints.conversationMessages('7'), '/api/conversas/7/mensagens');
    expect(
        ApiEndpoints.sendConversationMessage('7'), '/api/conversas/7/mensagem');
    expect(ApiEndpoints.conversationMessage('9'), '/api/conversas/mensagem/9');
    expect(ApiEndpoints.readAllNotifications(), '/api/notificacoes/ler-todas');
    expect(ApiEndpoints.userPreferences(), '/api/usuarios/me/preferencias');
  });
}
