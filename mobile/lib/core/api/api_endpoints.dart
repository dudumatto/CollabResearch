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
  static const String researchAreas = '/api/areas';
  static const String advisors = '/api/usuarios/orientadores';
  static const String subscriptions = '/api/inscricoes';
  static const String feedback = '/api/feedback';
  static const String notifications = '/api/notificacoes';
  static const String chatConversations = '/api/conversas';
  static const String users = '/api/usuarios';
  static const String advisor = '/api/orientador';
  static const String documents = '/api/documentos';

  static String project(String id) => '$projects/$id';
  static String acceptProjectOrientation(String id) =>
      '${project(id)}/aceitar-orientacao';
  static String rejectProjectOrientation(String id) =>
      '${project(id)}/rejeitar-orientacao';
  static String projectProgress(String id) => '${project(id)}/progresso';
  static String projectFeedback(String id) => '$feedback/projeto/$id';
  static String projectCollaborators(String id) =>
      '${project(id)}/colaboradores';
  static String projectApplications(String id) => '$subscriptions/projeto/$id';
  static String projectStages(String id) => '${project(id)}/etapas';
  static String projectStage(String projectId, String stageId) =>
      '${projectStages(projectId)}/$stageId';
  static String projectDeliveries(String id) => '${project(id)}/entregas';
  static String deliveryVersions(String projectId, String deliveryId) =>
      '${projectDeliveries(projectId)}/$deliveryId/versoes';
  static String reviewDeliveryVersion(
    String projectId,
    String deliveryId,
    String versionId,
  ) =>
      '${deliveryVersions(projectId, deliveryId)}/$versionId/revisao';
  static String downloadDeliveryVersion(
    String projectId,
    String deliveryId,
    String versionId,
  ) =>
      '${deliveryVersions(projectId, deliveryId)}/$versionId/download';
  static String projectEvaluations(String id) => '${project(id)}/avaliacoes';
  static String projectEvaluation(String projectId, String evaluationId) =>
      '${projectEvaluations(projectId)}/$evaluationId';
  static String acknowledgeEvaluation(
    String projectId,
    String evaluationId,
  ) =>
      '${projectEvaluation(projectId, evaluationId)}/ciencia';
  static String projectConversation(String id) =>
      '$chatConversations/projeto/$id/abrir';
  static String approveSubscription(String id) => '$subscriptions/$id/aprovar';
  static String rejectSubscription(String id) => '$subscriptions/$id/rejeitar';
  static String cancelSubscription(String id) => '$subscriptions/$id/cancelar';
  static String conversationMessages(String conversationId) =>
      '$chatConversations/$conversationId/mensagens';
  static String sendConversationMessage(String conversationId) =>
      '$chatConversations/$conversationId/mensagem';
  static String conversationMessage(String messageId) =>
      '$chatConversations/mensagem/$messageId';
  static String userConversations(String userId) =>
      '$chatConversations/$userId/todas';
  static String privateConversation(String userId) =>
      '$chatConversations/privada/$userId';
  static String notification(String id) => '$notifications/$id';
  static String readNotification(String id) => '${notification(id)}/ler';
  static String readAllNotifications() => '$notifications/ler-todas';
  static String user(String id) => '/api/usuarios/$id';
  static String userProjects(String id) => '${user(id)}/projetos';
  static String userPreferences() => '$me/preferencias';
  static String userProfile(String id) => '${user(id)}/perfil';
  static String userDocuments(String id) => '$documents/usuario/$id';
  static String document(String id) => '$documents/$id';
  static String documentDownload(String id) => '${document(id)}/download';
  static String advisorDashboard() => '$advisor/dashboard';
  static String advisorApplications() => '$advisor/inscricoes';
  static String advisees() => '$advisor/orientandos';
  static String advisee(String id) => '${advisees()}/$id';
  static String advisorProfile() => '$advisor/perfil';
}
