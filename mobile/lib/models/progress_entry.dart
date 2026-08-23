class ProgressEntry {
  const ProgressEntry({
    required this.id,
    required this.projectId,
    required this.description,
    this.title,
    this.type,
    this.phase,
    this.authorName,
    this.createdAt,
  });

  final String id;
  final String projectId;
  final String description;
  final String? title;
  final String? type;
  final String? phase;
  final String? authorName;
  final DateTime? createdAt;

  factory ProgressEntry.fromJson(Map<String, dynamic> json) {
    return ProgressEntry(
      id: '${json['id'] ?? ''}',
      projectId: '${json['projetoId'] ?? ''}',
      description: '${json['descricao'] ?? ''}',
      title: _text(json['titulo']),
      type: _text(json['tipo']),
      phase: _text(json['fase']),
      authorName: _text(json['autorNome']),
      createdAt: DateTime.tryParse('${json['dataRegistro'] ?? ''}'),
    );
  }

  static String? _text(dynamic value) {
    final text = value == null ? '' : '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
