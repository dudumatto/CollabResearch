class ApiEndpoints {
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String logout = '/api/auth/logout';
  static const String changePassword = '/api/auth/senha';
  static const String me = '/api/usuarios/me';
  static const String dashboard = '/api/dashboard';
  static const String dashboardStats = '$dashboard/stats';
  static const String dashboardActivity = '$dashboard/activity';
  static const String projects = '/api/projetos';
  static const String subscriptions = '/api/inscricoes';
  static const String notifications = '/api/notificacoes';
  static const String chatConversations = '/api/conversas';

  static String project(String id) => '$projects/$id';
  static String conversationMessages(String conversationId) =>
      '$chatConversations/$conversationId/mensagens';
  static String sendConversationMessage(String conversationId) =>
      '$chatConversations/$conversationId/mensagem';
  static String conversationMessage(String messageId) =>
      '$chatConversations/mensagem/$messageId';
  static String userConversations(String userId) =>
      '$chatConversations/$userId/todas';
  static String notification(String id) => '$notifications/$id';
  static String readNotification(String id) => '${notification(id)}/ler';
  static String readAllNotifications() => '$notifications/ler-todas';
  static String user(String id) => '/api/usuarios/$id';
  static String userPreferences() => '$me/preferencias';
}
