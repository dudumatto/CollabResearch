import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _institutionController = TextEditingController();
  final _semesterController = TextEditingController();
  final _bioController = TextEditingController();
  final _interestsController = TextEditingController();
  bool _editing = false;
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
    _nameController.text = user.name;
    _emailController.text = user.email;
    _institutionController.text = user.institution ?? '';
    _semesterController.text = user.semester?.toString() ?? '';
    _bioController.text = user.bio ?? '';
    _interestsController.text = user.interests ?? '';
  }

  Future<void> _saveProfile(AuthProvider auth) async {
    final current = auth.currentUser;
    if (current == null) return;

    final saved = await auth.updateProfile(
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

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
            saved ? 'Perfil atualizado.' : 'Nao foi possivel salvar o perfil.'),
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
    final projectsCount = context.watch<ProjectProvider>().projects.length;
    _syncForm(user);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        actions: [
          IconButton(
            onPressed: () => context.go('/settings'),
            icon: const Icon(Icons.settings),
            tooltip: 'Configuracoes',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                Container(
                  height: 88,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                  ),
                ),
                Transform.translate(
                  offset: const Offset(0, -36),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 42,
                        child: Text(
                          _initials(user),
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        user?.name.isNotEmpty == true ? user!.name : 'Usuario',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(_userType(user)),
                      Text(
                        user?.institution?.isNotEmpty == true
                            ? user!.institution!
                            : 'Instituicao nao informada',
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _ProfileStat(
                              label: 'Projetos', value: '$projectsCount'),
                          _ProfileStat(label: 'Tipo', value: _userType(user)),
                          _ProfileStat(
                            label: 'Curso',
                            value: user?.course?.isNotEmpty == true
                                ? user!.course!
                                : '-',
                          ),
                        ],
                      ),
                    ],
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Informacoes do perfil',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    if (_editing)
                      TextButton.icon(
                        onPressed: auth.isLoading
                            ? null
                            : () => setState(() => _editing = false),
                        icon: const Icon(Icons.close),
                        label: const Text('Cancelar'),
                      ),
                    TextButton.icon(
                      onPressed: auth.isLoading
                          ? null
                          : () {
                              if (_editing) {
                                _saveProfile(auth);
                              } else {
                                setState(() => _editing = true);
                              }
                            },
                      icon: Icon(
                          _editing ? Icons.save_outlined : Icons.edit_outlined),
                      label: Text(_editing ? 'Salvar' : 'Editar'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _ProfileField(
                  label: 'Nome completo',
                  icon: Icons.person_outline,
                  controller: _nameController,
                  enabled: _editing,
                ),
                _ProfileField(
                  label: 'Email',
                  icon: Icons.email_outlined,
                  controller: _emailController,
                  enabled: _editing,
                  keyboardType: TextInputType.emailAddress,
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
        ],
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleMedium),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
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
  });

  final String label;
  final IconData icon;
  final TextEditingController controller;
  final bool enabled;
  final TextInputType? keyboardType;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
        ),
      ),
    );
  }
}
