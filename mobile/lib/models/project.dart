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
    this.areaId,
    this.advisorId,
    this.ownerId,
    this.requirements,
    this.technologies,
    this.coverUrl,
    this.startDate,
    this.endDate,
    this.applicationDeadline,
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
  final int? areaId;
  final String? advisorId;
  final String? ownerId;
  final String? requirements;
  final String? technologies;
  final String? coverUrl;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? applicationDeadline;

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
      collaborators: (json['collaborators'] as num?)?.toInt() ??
          (json['vagasOcupadas'] as num?)?.toInt() ??
          0,
      description: (json['description'] ?? json['descricao']) as String?,
      advisorName: _nullableString(
        json['advisorName'] ??
            json['orientadorNome'] ??
            json['orientador']?['nome'] ??
            json['orientador']?['usuario']?['nome'],
      ),
      advisorAvatarUrl: _nullableString(
        json['orientadorFotoPerfilUrl'] ??
            json['advisorAvatarUrl'] ??
            json['orientadorFotoUrl'] ??
            json['orientador']?['fotoPerfilUrl'] ??
            json['orientador']?['avatarUrl'] ??
            json['orientador']?['usuario']?['fotoPerfilUrl'] ??
            json['orientador']?['usuario']?['avatarUrl'],
      ),
      ownerName: _nullableString(
        json['ownerName'] ??
            json['alunoCriadorNome'] ??
            json['alunoCriador']?['nome'] ??
            json['alunoCriador']?['usuario']?['nome'],
      ),
      ownerAvatarUrl: _nullableString(
        json['alunoCriadorFotoPerfilUrl'] ??
            json['ownerAvatarUrl'] ??
            json['alunoCriadorFotoUrl'] ??
            json['alunoCriador']?['fotoPerfilUrl'] ??
            json['alunoCriador']?['avatarUrl'] ??
            json['alunoCriador']?['usuario']?['fotoPerfilUrl'] ??
            json['alunoCriador']?['usuario']?['avatarUrl'],
      ),
      areaId: (json['areaId'] as num?)?.toInt() ?? _nestedInt(json['area']),
      advisorId: _nullableString(
        json['advisorId'] ??
            json['orientadorId'] ??
            json['orientador']?['usuario']?['id'],
      ),
      ownerId: _nullableString(
        json['ownerId'] ??
            json['alunoCriadorId'] ??
            json['alunoCriador']?['usuario']?['id'],
      ),
      requirements: _nullableString(json['requisitos'] ?? json['requirements']),
      technologies: _nullableString(
        json['tecnologias'] ?? json['technologies'] ?? json['competencias'],
      ),
      coverUrl: _nullableString(
        json['fotoProjetoUrl'] ?? json['coverUrl'] ?? json['imageUrl'],
      ),
      startDate: _date(json['dataInicio'] ?? json['startDate']),
      endDate: _date(json['dataFim'] ?? json['endDate']),
      applicationDeadline: _date(
        json['dataLimiteInscricao'] ?? json['applicationDeadline'],
      ),
    );
  }

  Map<String, dynamic> preservedUpdatePayload() => {
        'requisitos': requirements,
        'tecnologias': technologies,
        'fotoProjetoUrl': coverUrl,
        'dataInicio': _dateText(startDate),
        'dataFim': _dateText(endDate),
        'dataLimiteInscricao': _dateText(applicationDeadline),
      };

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = '$value'.trim();
    return text.isEmpty ? null : text;
  }

  static int? _nestedInt(dynamic value) {
    if (value is! Map) return null;
    return (value['id'] as num?)?.toInt();
  }

  static DateTime? _date(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse('$value');
  }

  static String? _dateText(DateTime? value) {
    if (value == null) return null;
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    return '${value.year}-$month-$day';
  }
}

class ProjectOption {
  const ProjectOption({required this.id, required this.name});

  final int id;
  final String name;

  factory ProjectOption.fromJson(Map<String, dynamic> json) {
    return ProjectOption(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: '${json['nome'] ?? json['name'] ?? ''}',
    );
  }
}
