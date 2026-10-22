class LumenRecommendation {
  const LumenRecommendation({
    required this.projectId,
    required this.title,
    required this.area,
    required this.justification,
  });

  final String projectId;
  final String title;
  final String area;
  final String justification;

  factory LumenRecommendation.fromJson(Map<String, dynamic> json) {
    return LumenRecommendation(
      projectId: '${json['projetoId'] ?? ''}',
      title: '${json['titulo'] ?? ''}',
      area: '${json['area'] ?? ''}',
      justification: '${json['justificativa'] ?? ''}',
    );
  }
}

class LumenResult {
  const LumenResult({this.recommendations = const [], this.notice});

  final List<LumenRecommendation> recommendations;
  final String? notice;

  factory LumenResult.fromJson(Map<String, dynamic> json) {
    final items = json['recomendacoes'];
    return LumenResult(
      recommendations: items is List
          ? items
              .whereType<Map>()
              .map((e) => LumenRecommendation.fromJson(
                  e.map((k, v) => MapEntry('$k', v))))
              .toList()
          : const [],
      notice: json['aviso'] as String?,
    );
  }
}

/// Candidato avaliado pela Lumen para um projeto (visao do orientador).
class LumenCandidate {
  const LumenCandidate({
    required this.subscriptionId,
    required this.score,
    this.justification,
    this.evaluation,
  });

  final String subscriptionId;
  final int score;
  final String? justification;
  final Map<String, dynamic>? evaluation;

  factory LumenCandidate.fromJson(Map<String, dynamic> json) {
    final evaluation = json['avaliacao'];
    return LumenCandidate(
      subscriptionId: '${json['inscricaoId'] ?? ''}',
      score: (json['pontuacao'] as num?)?.toInt() ?? 0,
      justification: json['justificativa'] as String?,
      evaluation: evaluation is Map
          ? evaluation.map((k, v) => MapEntry('$k', v))
          : null,
    );
  }
}
