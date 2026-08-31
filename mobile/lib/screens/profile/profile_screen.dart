import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/utils/validators.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/academic/academic_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _institutionController = TextEditingController();
  final _semesterController = TextEditingController();
  final _bioController = TextEditingController();
  final _interestsController = TextEditingController();
  bool _editing = false;
  bool _isSavingProfile = false;
  String? _loadedUserId;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _institutionController.dispose();
    _semesterController.dispose();
    _bioController.dispose();
    _interestsController.dispose();
    super.dispose();
  }

  void _syncForm(User? user) {
    if (user == null || _loadedUserId == user.id) return;
    _loadedUserId = user.id;
    _populateForm(user);
  }

  void _populateForm(User user) {
    _nameController.text = user.name;
    _emailController.text = user.email;
    _institutionController.text = user.institution ?? '';
    _semesterController.text = user.semester?.toString() ?? '';
    _bioController.text = user.bio ?? '';
    _interestsController.text = user.interests ?? '';
  }

  Future<void> _saveProfile(AuthProvider auth) async {
    if (_isSavingProfile || auth.isLoading) return;
    final current = auth.currentUser;
    if (current == null) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    var saved = false;
    String? errorMessage;
    setState(() => _isSavingProfile = true);
    try {
      saved = await auth.updateProfile(
        current.toProfileUpdatePayload(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          institution: _institutionController.text.trim(),
          bio: _bioController.text.trim(),
          semester: int.tryParse(_semesterController.text.trim()),
          interests: _interestsController.text.trim(),
          department: current.department,
          degree: current.degree,
        ),
      );
    } on DioException catch (error) {
      errorMessage = ApiClient.instance.friendlyError(error);
    } catch (_) {
      errorMessage = 'Nao foi possivel salvar o perfil.';
    }

    if (!mounted) return;
    setState(() => _isSavingProfile = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(saved
            ? 'Perfil atualizado.'
            : errorMessage ?? 'Nao foi possivel salvar o perfil.'),
      ),
    );
    if (saved) setState(() => _editing = false);
  }

  String _initials(User? user) {
    final name = user?.name.trim() ?? '';
    if (name.isEmpty) return 'U';
    return name
        .split(RegExp(r'\s+'))
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
  }

  String _userType(User? user) {
    final value =
        user?.type ?? (user?.roles.isNotEmpty == true ? user!.roles.first : '');
    return switch (value.toUpperCase()) {
      'ALUNO' => 'Aluno',
      'ORIENTADOR' => 'Orientador',
      'ADMIN' => 'Administrador',
      _ => value.isEmpty ? 'Perfil' : value,
    };
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final projectsCount =
        context.watch<DashboardProvider>().summary?.myProjects ?? 0;
    _syncForm(user);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 24,
        title: Text(
          'Perfil',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        actions: [
          IconButton(
            onPressed: () => context.go('/settings'),
            icon: const Icon(Icons.settings),
            tooltip: 'Configuracoes',
          ),
        ],
      ),
      body: user == null
          ? const ProfileSkeleton()
          : LayoutBuilder(
              builder: (context, pageConstraints) {
                // Mobile-only: usa a largura real disponível para o corpo da tela.
                final isMobile = pageConstraints.maxWidth <= 480;
                final isNarrowMobile = pageConstraints.maxWidth <= 360;

                return ListView(
                  // Mobile-only: recupera largura útil sem alterar tablet ou desktop.
                  padding: EdgeInsets.all(isMobile ? 16 : 24),
                  children: [
                    AppCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          Container(
                            height: 64,
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .primaryContainer,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(16),
                              ),
                            ),
                          ),
                          Transform.translate(
                            offset: const Offset(0, -28),
                            child: Padding(
                              // Mobile-only: impede textos longos de encostarem no card.
                              padding: EdgeInsets.symmetric(
                                  horizontal: isMobile ? 12 : 0),
                              child: Column(
                                children: [
                                  CircleAvatar(
                                    radius: 38,
                                    backgroundColor:
                                        Theme.of(context).colorScheme.primary,
                                    foregroundColor:
                                        Theme.of(context).colorScheme.onPrimary,
                                    foregroundImage: user.avatarUrl != null
                                        ? NetworkImage(user.avatarUrl!)
                                        : null,
                                    child: Text(
                                      _initials(user),
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineSmall
                                          ?.copyWith(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onPrimary,
                                          ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    user.name.isNotEmpty
                                        ? user.name
                                        : 'Usuario',
                                    maxLines: isMobile ? 2 : null,
                                    overflow: isMobile
                                        ? TextOverflow.ellipsis
                                        : TextOverflow.clip,
                                    textAlign: TextAlign.center,
                                    style:
                                        Theme.of(context).textTheme.titleLarge,
                                  ),
                                  Text(_userType(user)),
                                  Text(
                                    user.institution?.isNotEmpty == true
                                        ? user.institution!
                                        : 'Instituicao nao informada',
                                    maxLines: isMobile ? 2 : null,
                                    overflow: isMobile
                                        ? TextOverflow.ellipsis
                                        : TextOverflow.clip,
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 16),
                                  LayoutBuilder(
                                    builder: (context, constraints) {
                                      final stats = [
                                        _ProfileStat(
                                          label: 'Projetos',
                                          value: '$projectsCount',
                                          compact: isMobile,
                                        ),
                                        _ProfileStat(
                                          label: 'Tipo',
                                          value: _userType(user),
                                          compact: isMobile,
                                        ),
                                        _ProfileStat(
                                          label: 'Curso',
                                          value: user.course?.isNotEmpty == true
                                              ? user.course!
                                              : '-',
                                          compact: isMobile,
                                        ),
                                      ];

                                      if (!isMobile) {
                                        return Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: stats,
                                        );
                                      }

                                      // Mobile-only: em 320–360 px o curso ganha uma linha
                                      // inteira; de 361–480 px os três blocos dividem o card.
                                      const spacing = 8.0;
                                      final itemWidth = isNarrowMobile
                                          ? (constraints.maxWidth - spacing) / 2
                                          : (constraints.maxWidth -
                                                  spacing * 2) /
                                              3;

                                      return Wrap(
                                        key: const Key('profile-mobile-stats'),
                                        alignment: WrapAlignment.center,
                                        spacing: spacing,
                                        runSpacing: 12,
                                        children: [
                                          SizedBox(
                                              width: itemWidth,
                                              child: stats[0]),
                                          SizedBox(
                                              width: itemWidth,
                                              child: stats[1]),
                                          SizedBox(
                                            width: isNarrowMobile
                                                ? constraints.maxWidth
                                                : itemWidth,
                                            child: stats[2],
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Área acadêmica',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _userType(user) == 'Orientador'
                                ? 'Revise entregas e acompanhe avaliações da equipe.'
                                : 'Acompanhe seus prazos, entregas e avaliações.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 12),
                          AcademicActionTile(
                            icon: Icons.event_note_outlined,
                            title: 'Agenda',
                            description: 'Etapas e prazos dos projetos.',
                            onTap: () => context.push('/agenda'),
                          ),
                          const SizedBox(height: 8),
                          AcademicActionTile(
                            icon: Icons.upload_file_outlined,
                            title: 'Entregas',
                            description: _userType(user) == 'Orientador'
                                ? 'Arquivos aguardando revisão.'
                                : 'Arquivos enviados e novas versões.',
                            onTap: () => context.push('/deliveries'),
                          ),
                          const SizedBox(height: 8),
                          AcademicActionTile(
                            icon: Icons.fact_check_outlined,
                            title: 'Avaliações',
                            description: _userType(user) == 'Orientador'
                                ? 'Notas por etapa e ciência dos alunos.'
                                : 'Notas e comentários do orientador.',
                            onTap: () => context.push('/evaluations'),
                          ),
                          const SizedBox(height: 8),
                          if (_userType(user) == 'Orientador') ...[
                            AcademicActionTile(
                              icon: Icons.groups_outlined,
                              title: 'Orientandos',
                              description:
                                  'Progresso e pendências dos estudantes.',
                              onTap: () => context.push('/advisees'),
                            ),
                            const SizedBox(height: 8),
                          ],
                          AcademicActionTile(
                            icon: Icons.description_outlined,
                            title: 'Documentos',
                            description:
                                'Arquivos vinculados ao perfil acadêmico.',
                            onTap: () => context.push('/documents'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppCard(
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Informacoes do perfil',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Align(
                              alignment: Alignment.centerRight,
                              child: Wrap(
                                spacing: 4,
                                children: [
                                  if (_editing)
                                    TextButton.icon(
                                      onPressed: auth.isLoading ||
                                              _isSavingProfile
                                          ? null
                                          : () {
                                              _populateForm(user);
                                              setState(() => _editing = false);
                                            },
                                      icon: const Icon(Icons.close),
                                      label: const Text('Cancelar'),
                                    ),
                                  TextButton.icon(
                                    onPressed: auth.isLoading ||
                                            _isSavingProfile
                                        ? null
                                        : () {
                                            if (_editing) {
                                              _saveProfile(auth);
                                            } else {
                                              setState(() => _editing = true);
                                            }
                                          },
                                    icon: _editing &&
                                            (auth.isLoading || _isSavingProfile)
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : Icon(_editing
                                            ? Icons.save_outlined
                                            : Icons.edit_outlined),
                                    label: Text(_editing ? 'Salvar' : 'Editar'),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            _ProfileField(
                              label: 'Nome completo',
                              icon: Icons.person_outline,
                              controller: _nameController,
                              enabled: _editing,
                              validator: (value) => Validators.requiredField(
                                  value,
                                  label: 'Nome'),
                            ),
                            _ProfileField(
                              label: 'Email',
                              icon: Icons.email_outlined,
                              controller: _emailController,
                              enabled: _editing,
                              keyboardType: TextInputType.emailAddress,
                              validator: Validators.email,
                            ),
                            _ProfileField(
                              label: 'Instituicao',
                              icon: Icons.business_outlined,
                              controller: _institutionController,
                              enabled: _editing,
                            ),
                            _ProfileField(
                              label: 'Semestre',
                              icon: Icons.school_outlined,
                              controller: _semesterController,
                              enabled: _editing,
                              keyboardType: TextInputType.number,
                              validator: (value) => Validators.positiveInteger(
                                  value,
                                  label: 'Semestre'),
                            ),
                            _ProfileField(
                              label: 'Interesses',
                              icon: Icons.auto_awesome_outlined,
                              controller: _interestsController,
                              enabled: _editing,
                            ),
                            _ProfileField(
                              label: 'Biografia',
                              icon: Icons.notes_outlined,
                              controller: _bioController,
                              enabled: _editing,
                              maxLines: 3,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({
    required this.label,
    required this.value,
    this.compact = false,
  });

  final String label;
  final String value;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          // Mobile-only: restringe conteúdo dinâmico à célula do indicador.
          maxLines: compact ? 2 : null,
          overflow: compact ? TextOverflow.ellipsis : TextOverflow.clip,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        Text(
          label,
          maxLines: compact ? 1 : null,
          overflow: compact ? TextOverflow.ellipsis : TextOverflow.clip,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.label,
    required this.icon,
    required this.controller,
    required this.enabled,
    this.keyboardType,
    this.maxLines = 1,
    this.validator,
  });

  final String label;
  final IconData icon;
  final TextEditingController controller;
  final bool enabled;
  final TextInputType? keyboardType;
  final int maxLines;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
        ),
      ),
    );
  }
}
