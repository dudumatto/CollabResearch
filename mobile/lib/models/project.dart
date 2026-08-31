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

class ProjectPage {
  const ProjectPage({
    required this.items,
    required this.page,
    required this.totalPages,
    required this.totalElements,
    required this.isLast,
  });

  final List<Project> items;
  final int page;
  final int totalPages;
  final int totalElements;
  final bool isLast;

  factory ProjectPage.fromPayload(dynamic payload) {
    if (payload is List) {
      final items = _parseItems(payload);
      return ProjectPage(
        items: items,
        page: 0,
        totalPages: items.isEmpty ? 0 : 1,
        totalElements: items.length,
        isLast: true,
      );
    }

    final data = payload is Map
        ? payload.map((key, value) => MapEntry('$key', value))
        : const <String, dynamic>{};
    final rawItems = data['content'] is List
        ? data['content'] as List
        : data['data'] is List
            ? data['data'] as List
            : const <dynamic>[];
    final items = _parseItems(rawItems);
    final page = (data['page'] as num?)?.toInt() ?? 0;
    final totalPages =
        (data['totalPages'] as num?)?.toInt() ?? (items.isEmpty ? 0 : page + 1);

    return ProjectPage(
      items: items,
      page: page,
      totalPages: totalPages,
      totalElements: (data['totalElements'] as num?)?.toInt() ?? items.length,
      isLast: data['last'] as bool? ?? page + 1 >= totalPages,
    );
  }

  static List<Project> _parseItems(List<dynamic> values) {
    return values
        .whereType<Map>()
        .map((item) => Project.fromJson(
              item.map((key, value) => MapEntry('$key', value)),
            ))
        .toList();
  }
}
