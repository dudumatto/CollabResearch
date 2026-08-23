class FeedbackEntry {
  const FeedbackEntry({
    required this.id,
    required this.projectId,
    required this.rating,
    this.comment,
    this.reviewerName,
    this.createdAt,
  });

  final String id;
  final String projectId;
  final int rating;
  final String? comment;
  final String? reviewerName;
  final DateTime? createdAt;

  factory FeedbackEntry.fromJson(Map<String, dynamic> json) {
    return FeedbackEntry(
      id: '${json['id'] ?? ''}',
      projectId: '${json['projetoId'] ?? ''}',
      rating: (json['nota'] as num?)?.toInt() ?? 0,
      comment: _text(json['comentario']),
      reviewerName: _text(json['avaliadorNome']),
      createdAt: DateTime.tryParse('${json['dataFeedback'] ?? ''}'),
    );
  }

  static String? _text(dynamic value) {
    final text = value == null ? '' : '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
