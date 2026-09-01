import '../core/utils/date_utils.dart';
import 'project.dart';

String? _text(dynamic value) {
  if (value == null) return null;
  final text = '$value'.trim();
  return text.isEmpty ? null : text;
}

DateTime? _date(dynamic value) =>
    value == null ? null : DateTime.tryParse('$value');

class ProjectStage {
  const ProjectStage({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    this.description,
    this.weight = 0,
    this.order = 0,
    this.responsible = 'AMBOS',
    this.deadline,
    this.required = false,
    this.completedAt,
    this.completedByName,
    this.projectTitle,
  });

  final String id;
  final String projectId;
  final String title;
  final String status;
  final String? description;
  final double weight;
  final int order;
  final String responsible;
  final DateTime? deadline;
  final bool required;
  final DateTime? completedAt;
  final String? completedByName;
  final String? projectTitle;

  bool get isDone => status.toUpperCase() == 'DONE';

  /// Dias inteiros até o prazo: negativo no passado, 0 hoje, positivo à
  /// frente. Nulo quando a etapa não tem data.
  int? get daysUntilDeadline =>
      deadline == null ? null : DateUtilsX.daysUntil(deadline!);

  /// Comparação por **data**, não por instante. Antes usava
  /// `deadline.isBefore(DateTime.now())`, então uma etapa que vence hoje já
  /// aparecia atrasada às 00h01.
  bool get isOverdue {
    if (isDone) return false;
    final days = daysUntilDeadline;
    return days != null && days < 0;
  }

  factory ProjectStage.fromJson(Map<String, dynamic> json) => ProjectStage(
        id: '${json['id'] ?? ''}',
        projectId: '${json['projetoId'] ?? json['projectId'] ?? ''}',
        title: '${json['titulo'] ?? json['title'] ?? 'Etapa'}',
        status: '${json['status'] ?? 'PENDING'}',
        description: _text(json['descricao'] ?? json['description']),
        weight: (json['peso'] as num?)?.toDouble() ?? 0,
        order: (json['ordem'] as num?)?.toInt() ?? 0,
        responsible: '${json['responsavel'] ?? 'AMBOS'}',
        deadline: _date(json['prazo'] ?? json['deadline']),
        required: json['obrigatoria'] == true || json['required'] == true,
        completedAt: _date(json['concluidaEm'] ?? json['completedAt']),
        completedByName:
            _text(json['concluidaPorNome'] ?? json['completedByName']),
        projectTitle: _text(json['projetoTitulo'] ?? json['projectTitle']),
      );

  ProjectStage withProject(Project project) => ProjectStage(
        id: id,
        projectId: projectId.isEmpty ? project.id : projectId,
        title: title,
        status: status,
        description: description,
        weight: weight,
        order: order,
        responsible: responsible,
        deadline: deadline,
        required: required,
        completedAt: completedAt,
        completedByName: completedByName,
        projectTitle: project.title,
      );
}

class DeliveryItem {
  const DeliveryItem({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    this.category,
    this.stageId,
    this.stageTitle,
    this.authorId,
    this.authorName,
    this.createdAt,
    this.updatedAt,
    this.latestVersionId,
    this.totalVersions = 0,
    this.projectTitle,
  });

  final String id;
  final String projectId;
  final String title;
  final String status;
  final String? category;
  final String? stageId;
  final String? stageTitle;
  final String? authorId;
  final String? authorName;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? latestVersionId;
  final int totalVersions;
  final String? projectTitle;

  bool canResubmit({required String? userId, required bool isAdvisor}) =>
      !isAdvisor && userId != null && userId.isNotEmpty && authorId == userId;

  factory DeliveryItem.fromJson(Map<String, dynamic> json) => DeliveryItem(
        id: '${json['id'] ?? ''}',
        projectId: '${json['projetoId'] ?? ''}',
        title: '${json['titulo'] ?? 'Entrega'}',
        status: '${json['status'] ?? 'PENDING_REVIEW'}',
        category: _text(json['categoria']),
        stageId: _text(json['etapaId']),
        stageTitle: _text(json['etapaTitulo']),
        authorId: _text(json['autorId']),
        authorName: _text(json['autorNome']),
        createdAt: _date(json['criadaEm']),
        updatedAt: _date(json['atualizadaEm']),
        latestVersionId: _text(json['ultimaVersaoId']),
        totalVersions: (json['totalVersoes'] as num?)?.toInt() ?? 0,
        projectTitle: _text(json['projetoTitulo']),
      );

  DeliveryItem withProject(Project project) => DeliveryItem(
        id: id,
        projectId: projectId.isEmpty ? project.id : projectId,
        title: title,
        status: status,
        category: category,
        stageId: stageId,
        stageTitle: stageTitle,
        authorId: authorId,
        authorName: authorName,
        createdAt: createdAt,
        updatedAt: updatedAt,
        latestVersionId: latestVersionId,
        totalVersions: totalVersions,
        projectTitle: project.title,
      );
}

class DeliveryVersion {
  const DeliveryVersion({
    required this.id,
    required this.number,
    required this.fileName,
    this.contentType,
    this.sizeBytes = 0,
    this.sentAt,
    this.decision,
    this.reviewComment,
    this.reviewerName,
  });

  final String id;
  final int number;
  final String fileName;
  final String? contentType;
  final int sizeBytes;
  final DateTime? sentAt;
  final String? decision;
  final String? reviewComment;
  final String? reviewerName;

  factory DeliveryVersion.fromJson(Map<String, dynamic> json) {
    final review = json['revisao'] is Map
        ? Map<String, dynamic>.from(json['revisao'] as Map)
        : const <String, dynamic>{};
    return DeliveryVersion(
      id: '${json['id'] ?? ''}',
      number: (json['numeroVersao'] as num?)?.toInt() ?? 1,
      fileName: '${json['nomeArquivo'] ?? 'Arquivo'}',
      contentType: _text(json['contentType']),
      sizeBytes: (json['tamanhoBytes'] as num?)?.toInt() ?? 0,
      sentAt: _date(json['enviadaEm']),
      decision: _text(review['decisao']),
      reviewComment: _text(review['comentario']),
      reviewerName: _text(review['revisorNome']),
    );
  }
}

class AcademicEvaluation {
  const AcademicEvaluation({
    required this.id,
    required this.projectId,
    required this.studentId,
    required this.studentName,
    this.stageId,
    this.stageTitle,
    this.advisorName,
    this.participation = 0,
    this.technicalQuality = 0,
    this.deadlineCompliance = 0,
    this.communication = 0,
    this.advisorComment,
    this.average,
    this.acknowledged = false,
    this.studentComment,
    this.createdAt,
    this.projectTitle,
  });

  final String id;
  final String projectId;
  final String studentId;
  final String studentName;
  final String? stageId;
  final String? stageTitle;
  final String? advisorName;
  final int participation;
  final int technicalQuality;
  final int deadlineCompliance;
  final int communication;
  final String? advisorComment;
  final double? average;
  final bool acknowledged;
  final String? studentComment;
  final DateTime? createdAt;
  final String? projectTitle;

  factory AcademicEvaluation.fromJson(Map<String, dynamic> json) =>
      AcademicEvaluation(
        id: '${json['id'] ?? ''}',
        projectId: '${json['projetoId'] ?? ''}',
        studentId: '${json['alunoId'] ?? ''}',
        studentName: '${json['alunoNome'] ?? 'Estudante'}',
        stageId: _text(json['etapaId']),
        stageTitle: _text(json['etapaTitulo']),
        advisorName: _text(json['orientadorNome']),
        participation: (json['participacao'] as num?)?.toInt() ?? 0,
        technicalQuality: (json['qualidadeTecnica'] as num?)?.toInt() ?? 0,
        deadlineCompliance: (json['cumprimentoDePrazos'] as num?)?.toInt() ?? 0,
        communication: (json['comunicacao'] as num?)?.toInt() ?? 0,
        advisorComment: _text(json['comentarioOrientador']),
        average: (json['media'] as num?)?.toDouble(),
        acknowledged: json['cienciaRegistrada'] == true,
        studentComment: _text(json['comentarioAluno']),
        createdAt: _date(json['criadaEm']),
        projectTitle: _text(json['projetoTitulo']),
      );

  AcademicEvaluation withProject(Project project) => AcademicEvaluation(
        id: id,
        projectId: projectId.isEmpty ? project.id : projectId,
        studentId: studentId,
        studentName: studentName,
        stageId: stageId,
        stageTitle: stageTitle,
        advisorName: advisorName,
        participation: participation,
        technicalQuality: technicalQuality,
        deadlineCompliance: deadlineCompliance,
        communication: communication,
        advisorComment: advisorComment,
        average: average,
        acknowledged: acknowledged,
        studentComment: studentComment,
        createdAt: createdAt,
        projectTitle: project.title,
      );
}

class AdviseeProject {
  const AdviseeProject({
    required this.id,
    required this.title,
    required this.status,
  });

  final String id;
  final String title;
  final String status;

  factory AdviseeProject.fromJson(Map<String, dynamic> json) => AdviseeProject(
        id: '${json['projetoId'] ?? ''}',
        title: '${json['projetoTitulo'] ?? 'Projeto'}',
        status: '${json['status'] ?? ''}',
      );
}

class AdviseeSummary {
  const AdviseeSummary({
    required this.studentId,
    required this.userId,
    required this.name,
    this.email,
    this.avatarUrl,
    this.registrationNumber,
    this.course,
    this.situation = 'INATIVO',
    this.progress = 0,
    this.pendingItems = 0,
    this.projects = const <AdviseeProject>[],
  });

  final String studentId;
  final String userId;
  final String name;
  final String? email;
  final String? avatarUrl;
  final String? registrationNumber;
  final String? course;
  final String situation;
  final double progress;
  final int pendingItems;
  final List<AdviseeProject> projects;

  factory AdviseeSummary.fromJson(Map<String, dynamic> json) => AdviseeSummary(
        studentId: '${json['alunoId'] ?? ''}',
        userId: '${json['alunoUsuarioId'] ?? ''}',
        name: '${json['nome'] ?? 'Estudante'}',
        email: _text(json['email']),
        avatarUrl: _text(json['fotoPerfilUrl'] ?? json['avatarUrl']),
        registrationNumber: _text(json['ra']),
        course: _text(json['curso']),
        situation: '${json['situacao'] ?? 'INATIVO'}',
        progress: (json['progresso'] as num?)?.toDouble() ?? 0,
        pendingItems: (json['pendencias'] as num?)?.toInt() ?? 0,
        projects: (json['projetos'] as List? ?? const [])
            .whereType<Map>()
            .map((item) => AdviseeProject.fromJson(
                  item.map((key, value) => MapEntry('$key', value)),
                ))
            .toList(),
      );
}

class AdviseeDetail {
  const AdviseeDetail({
    required this.summary,
    this.semester,
    this.interests,
    this.selectedProject,
    this.stages = const <ProjectStage>[],
  });

  final AdviseeSummary summary;
  final int? semester;
  final String? interests;
  final AdviseeProject? selectedProject;
  final List<ProjectStage> stages;

  factory AdviseeDetail.fromJson(Map<String, dynamic> json) {
    final selected = json['projetoSelecionado'];
    return AdviseeDetail(
      summary: AdviseeSummary.fromJson(json),
      semester: (json['semestre'] as num?)?.toInt(),
      interests: _text(json['interesses']),
      selectedProject: selected is Map
          ? AdviseeProject.fromJson(
              selected.map((key, value) => MapEntry('$key', value)),
            )
          : null,
      stages: (json['etapas'] as List? ?? const [])
          .whereType<Map>()
          .map((item) => ProjectStage.fromJson(
                item.map((key, value) => MapEntry('$key', value)),
              ))
          .toList(),
    );
  }
}

class AcademicDocument {
  const AcademicDocument({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.url,
    this.sentAt,
  });

  final String id;
  final String name;
  final String type;
  final String status;
  final String? url;
  final DateTime? sentAt;

  Uri? get externalUri {
    final parsed = Uri.tryParse(url ?? '');
    if (parsed == null ||
        (parsed.scheme != 'http' && parsed.scheme != 'https')) {
      return null;
    }
    return parsed;
  }

  factory AcademicDocument.fromJson(Map<String, dynamic> json) =>
      AcademicDocument(
        id: '${json['id'] ?? ''}',
        name: '${json['nomeArquivo'] ?? json['name'] ?? 'Documento'}',
        type: '${json['tipo'] ?? 'DOCUMENTO'}',
        status: '${json['status'] ?? 'ENVIADO'}',
        url: _text(json['url'] ?? json['downloadUrl']),
        sentAt: _date(json['dataEnvio'] ?? json['dataUpload']),
      );
}

String? validateDeliveryReviewComment(String decision, String? comment) {
  if (decision.toUpperCase() == 'CHANGES_REQUESTED' &&
      (comment == null || comment.trim().isEmpty)) {
    return 'Informe os ajustes necessários.';
  }
  return null;
}

class AdvisorDashboard {
  const AdvisorDashboard({
    this.activeProjects = 0,
    this.orientationRequests = 0,
    this.pendingApplications = 0,
    this.activeAdvisees = 0,
    this.overdueStages = 0,
    this.deliveriesToReview = 0,
    this.evaluationsAwaitingAcknowledgement = 0,
  });

  final int activeProjects;
  final int orientationRequests;
  final int pendingApplications;
  final int activeAdvisees;
  final int overdueStages;
  final int deliveriesToReview;
  final int evaluationsAwaitingAcknowledgement;

  factory AdvisorDashboard.fromJson(Map<String, dynamic> json) {
    final source = json['metricas'] is Map
        ? Map<String, dynamic>.from(json['metricas'] as Map)
        : json;
    int value(String key) => (source[key] as num?)?.toInt() ?? 0;
    return AdvisorDashboard(
      activeProjects: value('projetosAtivos'),
      orientationRequests: value('solicitacoesOrientacao'),
      pendingApplications: value('inscricoesPendentes'),
      activeAdvisees: value('orientandosAtivos'),
      overdueStages: value('etapasAtrasadas'),
      deliveriesToReview: value('entregasAguardandoRevisao'),
      evaluationsAwaitingAcknowledgement: value('avaliacoesAguardandoCiencia'),
    );
  }
}
