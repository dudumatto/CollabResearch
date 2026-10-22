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
