import 'dart:convert';

class Subscription {
  const Subscription({
    required this.id,
    required this.status,
    required this.projectId,
    required this.projectTitle,
    this.studentName,
    this.studentId,
    this.studentUserId,
    this.studentAvatarUrl,
    this.motivation,
    this.advisorOpinion,
    this.createdAt,
    this.lumenScore,
    this.lumenJustification,
    this.lumenEvaluation,
  });

  final String id;
  final String status;
  final String projectId;
  final String projectTitle;
  final String? studentName;
  final String? studentId;
  final String? studentUserId;
  final String? studentAvatarUrl;
  final String? motivation;
  final String? advisorOpinion;
  final DateTime? createdAt;
  final int? lumenScore;
  final String? lumenJustification;

  /// Avaliacao detalhada da Lumen (notaFinal, confianca, criterios...).
  final Map<String, dynamic>? lumenEvaluation;

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
      studentId: _text(json['alunoId']),
      studentUserId: _text(json['alunoUsuarioId']),
      studentAvatarUrl:
          _text(json['alunoFotoPerfilUrl'] ?? json['studentAvatarUrl']),
      motivation: _text(json['motivacao']),
      advisorOpinion: _text(json['parecerOrientador']),
      createdAt: DateTime.tryParse('${json['dataInscricao'] ?? ''}'),
      lumenScore: (json['lumenPontuacao'] as num?)?.toInt(),
      lumenJustification: _text(json['lumenJustificativa']),
      lumenEvaluation: _map(json['lumenAvaliacao']),
    );
  }

  /// O backend serializa a avaliacao como string JSON; aceita tambem objeto.
  static Map<String, dynamic>? _map(dynamic value) {
    if (value is Map) return value.map((k, v) => MapEntry('$k', v));
    if (value is String && value.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is Map) return decoded.map((k, v) => MapEntry('$k', v));
      } catch (_) {}
    }
    return null;
  }

  /// Nota exibida: a exata da avaliacao detalhada, senao a arredondada.
  num? get lumenDisplayScore =>
      (lumenEvaluation?['notaFinal'] as num?) ?? lumenScore;

  Subscription withLumen({
    required int score,
    String? justification,
    Map<String, dynamic>? evaluation,
  }) {
    return Subscription(
      id: id,
      status: status,
      projectId: projectId,
      projectTitle: projectTitle,
      studentName: studentName,
      studentId: studentId,
      studentUserId: studentUserId,
      studentAvatarUrl: studentAvatarUrl,
      motivation: motivation,
      advisorOpinion: advisorOpinion,
      createdAt: createdAt,
      lumenScore: score,
      lumenJustification: justification,
      lumenEvaluation: evaluation,
    );
  }

  static String? _text(dynamic value) {
    final text = value == null ? '' : '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
