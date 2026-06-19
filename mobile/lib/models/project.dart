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
  });

  final String id;
  final String title;
  final String area;
  final String course;
  final String status;
  final int vacancies;
  final int collaborators;
  final String? description;

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
    );
  }
}
