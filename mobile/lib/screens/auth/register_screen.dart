import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_text_field.dart';

const _institutions = [
  'Universidade Federal do Brasil (UFB)',
  'Universidade Estadual de Sao Paulo (UNESP)',
  'Universidade de Sao Paulo (USP)',
  'Universidade Federal de Minas Gerais (UFMG)',
  'Pontificia Universidade Catolica (PUC)',
  'Outra',
];

const _academicTitles = ['Especialista', 'Mestre', 'Doutor', 'Pos-doutor'];

enum _RegisterRole { student, advisor }

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _raController = TextEditingController();
  final _departmentController = TextEditingController();

  int _step = 1;
  bool _acceptedTerms = false;
  bool _showPassword = false;
  String? _institution;
  String? _semester;
  String? _academicTitle;
  String? _error;
  _RegisterRole _role = _RegisterRole.student;

  bool get _isAdvisor => _role == _RegisterRole.advisor;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _raController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  void _next() {
    setState(() => _error = null);

    if (_step == 2) {
      if (!_formKey.currentState!.validate()) return;
      if (_passwordController.text != _confirmPasswordController.text) {
        setState(() => _error = 'As senhas nao coincidem.');
        return;
      }
      if (!_isAdvisor && _raController.text.trim().isEmpty) {
        setState(() => _error = 'Informe o RA para continuar.');
        return;
      }
    }

    if (_step < 3) setState(() => _step += 1);
  }

  void _back() {
    setState(() {
      _error = null;
      _step -= 1;
    });
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    if (!_acceptedTerms) {
      setState(() => _error = 'Aceite os termos para criar sua conta.');
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'As senhas nao coincidem.');
      return;
    }
    if (_isAdvisor &&
        (_departmentController.text.trim().isEmpty ||
            (_academicTitle ?? '').isEmpty)) {
      setState(
        () => _error =
            'Informe departamento e titulacao para criar a conta de orientador.',
      );
      return;
    }
    if (!_isAdvisor && _raController.text.trim().isEmpty) {
      setState(() => _error = 'Informe o RA para criar sua conta.');
      return;
    }

    final payload = <String, dynamic>{
      'nome': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'senha': _passwordController.text.trim(),
      'instituicao': _institution,
      'tipo': _isAdvisor ? 'ORIENTADOR' : 'ALUNO',
    };

    if (_isAdvisor) {
      payload['departamento'] = _departmentController.text.trim();
      payload['titulacao'] = _academicTitle;
    } else {
      payload['ra'] = _raController.text.trim();
      payload['semestre'] = int.tryParse(_semester ?? '');
    }

    try {
      await context.read<AuthProvider>().register(payload);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conta criada. Faca login para entrar.')),
      );
      context.go('/login');
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() => _error = ApiClient.instance.friendlyError(error));
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Nao foi possivel criar a conta.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Cadastro',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Criar sua conta para aluno ou orientador no mesmo fluxo do web.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    _StepProgress(step: _step, advisor: _isAdvisor),
                    const SizedBox(height: 18),
                    AppCard(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _step == 1
                            ? _RoleStep(
                                key: const ValueKey('role'),
                                role: _role,
                                onChanged: (value) =>
                                    setState(() => _role = value),
                              )
                            : _step == 2
                                ? _PersonalStep(
                                    key: const ValueKey('personal'),
                                    isAdvisor: _isAdvisor,
                                    showPassword: _showPassword,
                                    onTogglePassword: () => setState(
                                      () => _showPassword = !_showPassword,
                                    ),
                                    nameController: _nameController,
                                    emailController: _emailController,
                                    passwordController: _passwordController,
                                    confirmPasswordController:
                                        _confirmPasswordController,
                                    raController: _raController,
                                  )
                                : _AcademicStep(
                                    key: const ValueKey('academic'),
                                    isAdvisor: _isAdvisor,
                                    institution: _institution,
                                    semester: _semester,
                                    academicTitle: _academicTitle,
                                    acceptedTerms: _acceptedTerms,
                                    departmentController: _departmentController,
                                    onInstitutionChanged: (value) => setState(
                                      () => _institution = value,
                                    ),
                                    onSemesterChanged: (value) => setState(
                                      () => _semester = value,
                                    ),
                                    onAcademicTitleChanged: (value) => setState(
                                      () => _academicTitle = value,
                                    ),
                                    onTermsChanged: (value) => setState(
                                      () => _acceptedTerms = value ?? false,
                                    ),
                                  ),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.error),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        if (_step > 1)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: auth.isLoading ? null : _back,
                              child: const Text('Voltar'),
                            ),
                          ),
                        if (_step > 1) const SizedBox(width: 12),
                        Expanded(
                          child: AppButton(
                            label: _step == 3 ? 'Criar conta' : 'Continuar',
                            isLoading: auth.isLoading,
                            onPressed: _step == 3 ? _submit : _next,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed:
                          auth.isLoading ? null : () => context.go('/login'),
                      child: const Text('Ja tenho conta'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StepProgress extends StatelessWidget {
  const _StepProgress({required this.step, required this.advisor});

  final int step;
  final bool advisor;

  @override
  Widget build(BuildContext context) {
    final labels = [
      'Tipo',
      'Dados',
      advisor ? 'Profissional' : 'Academico',
    ];

    return Row(
      children: [
        for (var index = 0; index < labels.length; index++) ...[
          Expanded(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: index + 1 <= step
                      ? AppColors.primary
                      : AppColors.surfaceTint,
                  foregroundColor:
                      index + 1 <= step ? AppColors.surface : AppColors.muted,
                  child: Text('${index + 1}'),
                ),
                const SizedBox(height: 6),
                Text(
                  labels[index],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          if (index < labels.length - 1)
            Container(
              width: 24,
              height: 1,
              color: index + 1 < step ? AppColors.primary : AppColors.border,
            ),
        ],
      ],
    );
  }
}

class _RoleStep extends StatelessWidget {
  const _RoleStep({
    super.key,
    required this.role,
    required this.onChanged,
  });

  final _RegisterRole role;
  final ValueChanged<_RegisterRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Como voce vai usar a plataforma?',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 6),
        Text(
          'Escolha o tipo de conta que melhor descreve seu papel.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        _RoleOption(
          selected: role == _RegisterRole.student,
          icon: Icons.school_outlined,
          title: 'Aluno',
          subtitle: 'Busco projetos de IC para participar',
          onTap: () => onChanged(_RegisterRole.student),
        ),
        const SizedBox(height: 12),
        _RoleOption(
          selected: role == _RegisterRole.advisor,
          icon: Icons.science_outlined,
          title: 'Orientador',
          subtitle: 'Tenho projetos e quero orientar alunos',
          onTap: () => onChanged(_RegisterRole.advisor),
        ),
      ],
    );
  }
}

class _RoleOption extends StatelessWidget {
  const _RoleOption({
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: selected ? AppColors.surfaceTint : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: selected ? 1.4 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor:
                    selected ? AppColors.primary : AppColors.surfaceTint,
                foregroundColor:
                    selected ? AppColors.surface : AppColors.primary,
                child: Icon(icon),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    Text(subtitle,
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class _PersonalStep extends StatelessWidget {
  const _PersonalStep({
    super.key,
    required this.isAdvisor,
    required this.showPassword,
    required this.onTogglePassword,
    required this.nameController,
    required this.emailController,
    required this.passwordController,
    required this.confirmPasswordController,
    required this.raController,
  });

  final bool isAdvisor;
  final bool showPassword;
  final VoidCallback onTogglePassword;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController confirmPasswordController;
  final TextEditingController raController;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Dados pessoais', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 6),
        Text('Preencha suas informacoes basicas.',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Nome completo',
          controller: nameController,
          textInputAction: TextInputAction.next,
          validator: (value) => Validators.requiredField(value, label: 'Nome'),
        ),
        const SizedBox(height: 14),
        AppTextField(
          label: 'E-mail institucional',
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          validator: Validators.email,
        ),
        if (!isAdvisor) ...[
          const SizedBox(height: 14),
          AppTextField(
            label: 'RA',
            controller: raController,
            textInputAction: TextInputAction.next,
            validator: (value) => Validators.requiredField(value, label: 'RA'),
          ),
        ],
        const SizedBox(height: 14),
        TextFormField(
          controller: passwordController,
          obscureText: !showPassword,
          textInputAction: TextInputAction.next,
          validator: (value) => Validators.requiredField(value, label: 'Senha'),
          decoration: InputDecoration(
            labelText: 'Senha',
            suffixIcon: IconButton(
              onPressed: onTogglePassword,
              icon:
                  Icon(showPassword ? Icons.visibility_off : Icons.visibility),
            ),
          ),
        ),
        const SizedBox(height: 14),
        AppTextField(
          label: 'Confirmar senha',
          controller: confirmPasswordController,
          obscureText: true,
          textInputAction: TextInputAction.done,
          validator: (value) =>
              Validators.requiredField(value, label: 'Confirmar senha'),
        ),
      ],
    );
  }
}

class _AcademicStep extends StatelessWidget {
  const _AcademicStep({
    super.key,
    required this.isAdvisor,
    required this.institution,
    required this.semester,
    required this.academicTitle,
    required this.acceptedTerms,
    required this.departmentController,
    required this.onInstitutionChanged,
    required this.onSemesterChanged,
    required this.onAcademicTitleChanged,
    required this.onTermsChanged,
  });

  final bool isAdvisor;
  final String? institution;
  final String? semester;
  final String? academicTitle;
  final bool acceptedTerms;
  final TextEditingController departmentController;
  final ValueChanged<String?> onInstitutionChanged;
  final ValueChanged<String?> onSemesterChanged;
  final ValueChanged<String?> onAcademicTitleChanged;
  final ValueChanged<bool?> onTermsChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isAdvisor ? 'Dados profissionais' : 'Informacoes academicas',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 6),
        Text(
          isAdvisor
              ? 'Esses dados identificam sua area de orientacao.'
              : 'Esses dados ajudam na organizacao do perfil.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          initialValue: institution,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Instituicao de ensino'),
          items: [
            for (final institution in _institutions)
              DropdownMenuItem(value: institution, child: Text(institution)),
          ],
          onChanged: onInstitutionChanged,
          validator: (value) =>
              Validators.requiredField(value, label: 'Instituicao'),
        ),
        if (isAdvisor) ...[
          const SizedBox(height: 14),
          AppTextField(
            label: 'Departamento',
            controller: departmentController,
            validator: (value) =>
                Validators.requiredField(value, label: 'Departamento'),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: academicTitle,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Titulacao'),
            items: [
              for (final title in _academicTitles)
                DropdownMenuItem(value: title, child: Text(title)),
            ],
            onChanged: onAcademicTitleChanged,
            validator: (value) =>
                Validators.requiredField(value, label: 'Titulacao'),
          ),
        ] else ...[
          const SizedBox(height: 14),
          Text(
            'O curso sera definido pela administracao apos a criacao da conta.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: semester,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Semestre atual'),
            items: [
              for (var semester = 1; semester <= 10; semester++)
                DropdownMenuItem(
                  value: '$semester',
                  child: Text('$semester semestre'),
                ),
            ],
            onChanged: onSemesterChanged,
          ),
        ],
        const SizedBox(height: 10),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: acceptedTerms,
          onChanged: onTermsChanged,
          controlAffinity: ListTileControlAffinity.leading,
          title: const Text(
              'Concordo com os Termos de Uso e a Politica de Privacidade'),
        ),
      ],
    );
  }
}
