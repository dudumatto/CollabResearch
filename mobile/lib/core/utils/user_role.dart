import '../../models/user.dart';

enum AppUserRole { student, advisor, admin, unknown }

AppUserRole userRoleOf(User? user) {
  final values = <String>[
    if (user?.type != null) user!.type!,
    ...?user?.roles,
  ].map((value) => value.trim().toUpperCase());

  if (values.contains('ORIENTADOR')) return AppUserRole.advisor;
  if (values.contains('ALUNO')) return AppUserRole.student;
  if (values.contains('ADMIN')) return AppUserRole.admin;
  return AppUserRole.unknown;
}

bool isAdvisor(User? user) => userRoleOf(user) == AppUserRole.advisor;
bool isStudent(User? user) => userRoleOf(user) == AppUserRole.student;

String roleLabel(User? user) {
  return switch (userRoleOf(user)) {
    AppUserRole.student => 'Aluno',
    AppUserRole.advisor => 'Orientador',
    AppUserRole.admin => 'Administrador',
    AppUserRole.unknown => 'Perfil',
  };
}
