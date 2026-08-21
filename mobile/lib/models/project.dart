class Project {
  const Project({
    required this.id,
    required this.title,
    required this.area,
    required this.course,
    required this.status,
    this.vacancies = 0,
    this.collaborators = 0,
    this.description,
    this.advisorName,
    this.advisorAvatarUrl,
    this.ownerName,
    this.ownerAvatarUrl,
  });

  final String id;
  final String title;
  final String area;
  final String course;
  final String status;
  final int vacancies;
  final int collaborators;
  final String? description;
  final String? advisorName;
  final String? advisorAvatarUrl;
  final String? ownerName;
  final String? ownerAvatarUrl;

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? json['titulo'] ?? ''}',
      area: '${json['area'] ?? json['areaNome'] ?? ''}',
      course: '${json['course'] ?? json['cursoNome'] ?? ''}',
      status: '${json['status'] ?? ''}',
      vacancies: (json['vacancies'] as num?)?.toInt() ??
          (json['vagas'] as num?)?.toInt() ??
          0,
      collaborators: (json['collaborators'] as num?)?.toInt() ?? 0,
      description: (json['description'] ?? json['descricao']) as String?,
      advisorName: _nullableString(
        json['advisorName'] ??
            json['orientadorNome'] ??
            json['orientador']?['nome'] ??
            json['orientador']?['usuario']?['nome'],
      ),
      advisorAvatarUrl: _nullableString(
        json['advisorAvatarUrl'] ??
            json['orientadorFotoPerfilUrl'] ??
            json['orientadorFotoUrl'] ??
            json['orientador']?['avatarUrl'] ??
            json['orientador']?['fotoPerfilUrl'] ??
            json['orientador']?['usuario']?['avatarUrl'] ??
            json['orientador']?['usuario']?['fotoPerfilUrl'],
      ),
      ownerName: _nullableString(
        json['ownerName'] ??
            json['alunoCriadorNome'] ??
            json['alunoCriador']?['nome'] ??
            json['alunoCriador']?['usuario']?['nome'],
      ),
      ownerAvatarUrl: _nullableString(
        json['ownerAvatarUrl'] ??
            json['alunoCriadorFotoPerfilUrl'] ??
            json['alunoCriadorFotoUrl'] ??
            json['alunoCriador']?['avatarUrl'] ??
            json['alunoCriador']?['fotoPerfilUrl'] ??
            json['alunoCriador']?['usuario']?['avatarUrl'] ??
            json['alunoCriador']?['usuario']?['fotoPerfilUrl'],
      ),
    );
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
