class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    this.course,
    this.avatarUrl,
    this.roles = const <String>[],
    this.institution,
    this.bio,
    this.theme,
    this.notificationsEnabled = true,
    this.semester,
    this.interests,
    this.department,
    this.degree,
    this.type,
  });

  final String id;
  final String name;
  final String email;
  final String? course;
  final String? avatarUrl;
  final List<String> roles;
  final String? institution;
  final String? bio;
  final String? theme;
  final bool notificationsEnabled;
  final int? semester;
  final String? interests;
  final String? department;
  final String? degree;
  final String? type;

  factory User.fromJwtPayload(Map<String, dynamic> payload) {
    return User(
      id: '${payload['sub'] ?? payload['id'] ?? ''}',
      name: '${payload['name'] ?? payload['fullName'] ?? ''}',
      email: '${payload['email'] ?? ''}',
      course: payload['course'] as String?,
      avatarUrl: payload['avatarUrl'] as String?,
      type: payload['tipo'] as String?,
      roles: (payload['roles'] as List?)?.map((e) => '$e').toList() ??
          const <String>[],
    );
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: '${json['id'] ?? ''}',
      name: '${json['name'] ?? json['nome'] ?? ''}',
      email: '${json['email'] ?? ''}',
      course: (json['course'] ?? json['cursoNome']) as String?,
      avatarUrl: json['avatarUrl'] as String?,
      institution: (json['institution'] ?? json['instituicao']) as String?,
      bio: json['bio'] as String?,
      theme: json['tema'] as String?,
      notificationsEnabled: json['notificacoesAtivas'] != false,
      semester: (json['semester'] as num?)?.toInt() ??
          (json['semestre'] as num?)?.toInt(),
      interests: json['interesses'] as String?,
      department: json['departamento'] as String?,
      degree: json['titulacao'] as String?,
      type: json['tipo'] as String?,
      roles: (json['roles'] as List?)?.map((e) => '$e').toList() ??
          (json['tipo'] == null
              ? const <String>[]
              : <String>['${json['tipo']}']),
    );
  }

  Map<String, dynamic> toProfileUpdatePayload({
    required String name,
    required String email,
    String? institution,
    String? bio,
    int? semester,
    String? interests,
    String? department,
    String? degree,
  }) {
    return {
      'nome': name,
      'email': email,
      'instituicao': institution,
      'bio': bio,
      'semestre': semester,
      'interesses': interests,
      'departamento': department,
      'titulacao': degree,
    };
  }
}
