class Subscription {
  const Subscription({
    required this.id,
    required this.status,
    required this.projectId,
    required this.projectTitle,
    this.studentName,
    this.motivation,
    this.advisorOpinion,
    this.createdAt,
  });

  final String id;
  final String status;
  final String projectId;
  final String projectTitle;
  final String? studentName;
  final String? motivation;
  final String? advisorOpinion;
  final DateTime? createdAt;

  factory Subscription.fromJson(Map<String, dynamic> json) {
    final project = json['projeto'];
    return Subscription(
      id: '${json['id'] ?? ''}',
      status: '${json['status'] ?? ''}',
      projectId:
          '${json['projetoId'] ?? (project is Map ? project['id'] : null) ?? ''}',
      projectTitle:
          '${json['projetoTitulo'] ?? (project is Map ? project['titulo'] : null) ?? 'Projeto'}',
      studentName: _text(json['alunoNome']),
      motivation: _text(json['motivacao']),
      advisorOpinion: _text(json['parecerOrientador']),
      createdAt: DateTime.tryParse('${json['dataInscricao'] ?? ''}'),
    );
  }

  static String? _text(dynamic value) {
    final text = value == null ? '' : '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
