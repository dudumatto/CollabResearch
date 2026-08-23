class DashboardSummary {
  const DashboardSummary({
    this.totalProjects = 0,
    this.myProjects = 0,
    this.mySubscriptions = 0,
    this.pendingSubscriptions = 0,
    this.unreadNotifications = 0,
    this.activeConversations = 0,
    this.uploadedDocuments = 0,
  });

  final int totalProjects;
  final int myProjects;
  final int mySubscriptions;
  final int pendingSubscriptions;
  final int unreadNotifications;
  final int activeConversations;
  final int uploadedDocuments;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    int value(String key) => (json[key] as num?)?.toInt() ?? 0;
    return DashboardSummary(
      totalProjects: value('totalProjetos'),
      myProjects: value('meusProjetos'),
      mySubscriptions: value('minhasInscricoes'),
      pendingSubscriptions: value('inscricoesPendentes'),
      unreadNotifications: value('notificacoesNaoLidas'),
      activeConversations: value('conversasAtivas'),
      uploadedDocuments: value('documentosEnviados'),
    );
  }
}
