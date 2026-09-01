import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/utils/validators.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/confirm_logout.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_section_header.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_snackbar.dart';
import '../../widgets/common/app_avatar.dart';

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

  /// Assinatura do usuario ja carregado nos controllers. Chavear so pelo id
  /// deixava o formulario preso aos dados magros do JWT: quando o
  /// refreshProfile trazia instituicao, bio e semestre, os campos nao eram
  /// atualizados e um "Salvar" gravava vazio por cima do servidor.
  String? _syncedSignature;

  // Sem busca automatica no initState de proposito: a tela nao tem ponto de
  // injecao para o cliente HTTP, entao dispararia rede de verdade em todo
  // teste de widget. O perfil ja e buscado no login e o RefreshIndicator
  // desta tela cobre a atualizacao sob demanda.

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
    if (user == null) return;
    // Nunca sobrescrever o que o usuario esta digitando: um refreshProfile
    // concluido no meio da edicao apagaria o formulario.
    if (_editing) return;
    final signature = _signatureOf(user);
    if (_syncedSignature == signature) return;
    _syncedSignature = signature;
    _populateForm(user);
  }

  String _signatureOf(User user) {
    return [
      user.id,
      user.name,
      user.email,
      user.institution,
      user.semester,
      user.bio,
      user.interests,
    ].join('|');
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
      errorMessage = 'Não foi possível salvar o perfil.';
    }

    if (!mounted) return;
    setState(() => _isSavingProfile = false);
    if (saved) {
      AppSnackbar.showSuccess(context, 'Perfil atualizado.');
    } else {
      AppSnackbar.showError(
        context,
        errorMessage ?? 'Não foi possível salvar o perfil.',
      );
    }
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
    // O contador vem do DashboardProvider, que esta noutra aba do
    // StatefulShellRoute e pode nunca ter carregado -- ao abrir o perfil
    // direto, summary e null. Antes isso virava "0 Projetos", afirmando que o
    // usuario nao tem nenhum enquanto o painel mostrava tres. Sem summary o
    // dado e desconhecido, e a tela passa a dizer isso em vez de chutar zero.
    //
    // Buscar aqui nao e opcao: ver a nota no topo do State sobre nao disparar
    // rede no initState.
    final summary = context.watch<DashboardProvider>().summary;
    final projectsCount = summary == null ? '—' : '${summary.myProjects}';
    _syncForm(user);

    return Scaffold(
      body: user == null
          ? (auth.isLoading
              ? const ProfileSkeleton()
              : AppErrorState(
                  message: 'Não foi possível carregar seu perfil.',
                  onRetry: auth.refreshProfile,
                ))
          : LayoutBuilder(
              builder: (context, pageConstraints) {
                // Mobile-only: usa a largura real disponível para o corpo da tela.
                final isMobile = pageConstraints.maxWidth <= 480;
                final isNarrowMobile = pageConstraints.maxWidth <= 360;

                return RefreshIndicator(
                  onRefresh: auth.refreshProfile,
                  child: Center(
                    child: ConstrainedBox(
                      // Mesma largura do ProfileSkeleton: antes o esqueleto e a
                      // tela real tinham medidas diferentes.
                      constraints: const BoxConstraints(maxWidth: 920),
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        // Mobile-only: recupera largura útil sem alterar tablet ou desktop.
                        padding: EdgeInsets.fromLTRB(
                          isMobile ? 16 : 24,
                          MediaQuery.paddingOf(context).top +
                              (isMobile ? 16 : 24),
                          isMobile ? 16 : 24,
                          // O ultimo campo ficava sob a barra de navegacao.
                          AppSpacing.xl + MediaQuery.paddingOf(context).bottom,
                        ),
                        children: [
                          AppPageHeader(
                            eyebrow: 'Conta',
                            title: 'Perfil',
                            description:
                                'Seus dados acadêmicos e atalhos de acompanhamento.',
                            trailing: Material(
                              color: Colors.white.withValues(alpha: 0.18),
                              shape: const CircleBorder(),
                              clipBehavior: Clip.antiAlias,
                              child: IconButton(
                                onPressed: () => context.go('/settings'),
                                tooltip: 'Configurações',
                                icon: const Icon(
                                  Icons.settings,
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ),
                            ),
                          ),
                          AppCard(
                            child: Column(
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    AppAvatar(
                                      name: user.name,
                                      imageUrl: user.avatarUrl,
                                      radius: 32,
                                      backgroundColor:
                                          Theme.of(context).colorScheme.primary,
                                      foregroundColor: Theme.of(context)
                                          .colorScheme
                                          .onPrimary,
                                      initials: _initials(user),
                                    ),
                                    const SizedBox(width: AppSpacing.md),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            user.name.isNotEmpty
                                                ? user.name
                                                : 'Usuário',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleLarge
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                          const SizedBox(height: AppSpacing.sm),
                                          // Cargo como selo: outra categoria de
                                          // informacao, nao mais uma linha de corpo.
                                          Wrap(
                                            spacing: AppSpacing.sm,
                                            runSpacing: AppSpacing.sm,
                                            children: [
                                              AppBadge(label: _userType(user)),
                                              if (user.degree?.isNotEmpty ==
                                                  true)
                                                AppBadge(label: user.degree!),
                                            ],
                                          ),
                                          const SizedBox(height: AppSpacing.sm),
                                          Text(
                                            user.institution?.isNotEmpty == true
                                                ? user.institution!
                                                : 'Instituição não informada',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: Theme.of(context)
                                                      .colorScheme
                                                      .onSurfaceVariant,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: AppSpacing.lg),
                                Divider(
                                  height: 1,
                                  thickness: 0.8,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .outlineVariant,
                                ),
                                const SizedBox(height: AppSpacing.lg),
                                LayoutBuilder(
                                  builder: (context, constraints) {
                                    // "Tipo" saiu: virou o selo logo acima. Semestre
                                    // usa um dado que a API ja devolvia e a tela
                                    // ignorava.
                                    final stats = [
                                      _ProfileStat(
                                        label: 'Projetos',
                                        value: projectsCount,
                                        compact: isMobile,
                                      ),
                                      _ProfileStat(
                                        label: 'Semestre',
                                        value: user.semester != null
                                            ? '${user.semester}º'
                                            : '-',
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
                                      // Expanded evita o overflow real que havia
                                      // entre 481 e 600 px com curso longo.
                                      return Row(
                                        children: [
                                          for (final stat in stats)
                                            Expanded(child: stat),
                                        ],
                                      );
                                    }

                                    // Mobile-only: em 320–360 px o curso ganha uma linha
                                    // inteira; de 361–480 px os três blocos dividem o card.
                                    const spacing = 8.0;
                                    final itemWidth = isNarrowMobile
                                        ? (constraints.maxWidth - spacing) / 2
                                        : (constraints.maxWidth - spacing * 2) /
                                            3;

                                    return Wrap(
                                      key: const Key('profile-mobile-stats'),
                                      alignment: WrapAlignment.center,
                                      spacing: spacing,
                                      runSpacing: 12,
                                      children: [
                                        SizedBox(
                                            width: itemWidth, child: stats[0]),
                                        SizedBox(
                                            width: itemWidth, child: stats[1]),
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
                          const SizedBox(height: AppSpacing.lg),
                          _AcademicDataCard(user: user),
                          AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Área acadêmica',
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
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
                                    'Informações do perfil',
                                    style:
                                        Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: Wrap(
                                      spacing: AppSpacing.sm,
                                      children: [
                                        if (_editing)
                                          TextButton.icon(
                                            // 44dp: o padrao do TextButton e 36.
                                            style: TextButton.styleFrom(
                                              minimumSize: const Size(88, 44),
                                            ),
                                            onPressed: auth.isLoading ||
                                                    _isSavingProfile
                                                ? null
                                                : () {
                                                    _populateForm(user);
                                                    setState(
                                                        () => _editing = false);
                                                  },
                                            icon: const Icon(Icons.close),
                                            label: const Text('Cancelar'),
                                          ),
                                        TextButton.icon(
                                          style: TextButton.styleFrom(
                                            minimumSize: const Size(88, 44),
                                          ),
                                          onPressed: auth.isLoading ||
                                                  _isSavingProfile
                                              ? null
                                              : () {
                                                  if (_editing) {
                                                    _saveProfile(auth);
                                                  } else {
                                                    setState(
                                                        () => _editing = true);
                                                  }
                                                },
                                          icon: _editing &&
                                                  (auth.isLoading ||
                                                      _isSavingProfile)
                                              ? const SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                  ),
                                                )
                                              : Icon(_editing
                                                  ? Icons.save_outlined
                                                  : Icons.edit_outlined),
                                          label: Text(
                                              _editing ? 'Salvar' : 'Editar'),
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
                                    validator: (value) =>
                                        Validators.requiredField(value,
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
                                    key: const ValueKey(
                                        'profile-field-instituicao'),
                                    label: 'Instituição',
                                    icon: Icons.business_outlined,
                                    controller: _institutionController,
                                    enabled: _editing,
                                  ),
                                  _ProfileField(
                                    key: const ValueKey(
                                        'profile-field-semestre'),
                                    label: 'Semestre',
                                    icon: Icons.school_outlined,
                                    controller: _semesterController,
                                    enabled: _editing,
                                    keyboardType: TextInputType.number,
                                    validator: (value) =>
                                        Validators.positiveInteger(value,
                                            label: 'Semestre'),
                                  ),
                                  _ProfileField(
                                    label: 'Interesses',
                                    icon: Icons.auto_awesome_outlined,
                                    controller: _interestsController,
                                    enabled: _editing,
                                  ),
                                  _ProfileField(
                                    key: const ValueKey(
                                        'profile-field-biografia'),
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
                          const SizedBox(height: AppSpacing.lg),
                          // Sair fica onde as pessoas procuram. Acao destrutiva
                          // discreta, nao um botao vermelho preenchido.
                          TextButton.icon(
                            onPressed: () => confirmLogout(context),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.danger,
                              minimumSize: const Size.fromHeight(48),
                            ),
                            icon: const Icon(Icons.logout_rounded, size: 20),
                            label: const Text('Sair da conta'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

/// Dados que a API ja devolve e a tela ignorava. Cada linha so aparece com
/// valor preenchido; sem nenhum deles, a secao inteira some, em vez de virar
/// uma parede de "nao informado".
class _AcademicDataCard extends StatelessWidget {
  const _AcademicDataCard({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    final rows = <({String label, String value})>[
      if (user.registrationNumber?.isNotEmpty == true)
        (label: 'RA', value: user.registrationNumber!),
      if (user.department?.isNotEmpty == true)
        (label: 'Departamento', value: user.department!),
    ];
    final extraRoles = user.roles.length > 1 ? user.roles : const <String>[];

    if (rows.isEmpty && extraRoles.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AppSectionHeader(title: 'Dados acadêmicos'),
            const SizedBox(height: AppSpacing.md),
            for (final row in rows) ...[
              Semantics(
                label: '${row.label}: ${row.value}',
                excludeSemantics: true,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 116,
                      child: Text(
                        row.label,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        row.value,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            if (extraRoles.isNotEmpty) ...[
              Text(
                'Funções',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  for (final role in extraRoles) AppBadge(label: role),
                ],
              ),
            ],
          ],
        ),
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
    // Sem o Semantics agrupado, o leitor de tela anuncia "2" e "Projetos"
    // como dois textos soltos.
    return Semantics(
      label: '$label: $value',
      excludeSemantics: true,
      child: Column(
        children: [
          Text(
            value,
            // Restringe conteúdo dinâmico à célula do indicador. O clamp vale
            // tambem no desktop: sem ele, um curso longo transbordava a Row.
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    super.key,
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
