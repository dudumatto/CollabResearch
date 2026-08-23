import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_text_field.dart';
import '../../widgets/common/collab_logo.dart';

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
  final _institutionController = TextEditingController();
  final _raController = TextEditingController();
  final _semesterController = TextEditingController();
  final _departmentController = TextEditingController();
  final _degreeController = TextEditingController();
  String _userType = 'ALUNO';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _institutionController.dispose();
    _raController.dispose();
    _semesterController.dispose();
    _departmentController.dispose();
    _degreeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
            return SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(20, 24, 20, 24 + bottomInset),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 48,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 560),
                    child: TweenAnimationBuilder<double>(
                      duration: const Duration(milliseconds: 420),
                      curve: Curves.easeOutCubic,
                      tween: Tween(begin: 0, end: 1),
                      builder: (context, value, child) => Opacity(
                        opacity: value,
                        child: Transform.translate(
                          offset: Offset(0, 16 * (1 - value)),
                          child: child,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const CollabLogo(height: 34),
                          const SizedBox(height: 18),
                          Text(
                            'Crie sua conta',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Informe seu vínculo acadêmico para personalizar a experiência.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 24),
                          AppCard(
                            padding: const EdgeInsets.all(24),
                            child: Form(
                              key: _formKey,
                              child: _buildForm(context, auth),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildForm(BuildContext context, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Qual é o seu perfil?',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: const [
            ButtonSegment(
              value: 'ALUNO',
              icon: Icon(Icons.school_outlined),
              label: Text('Aluno'),
            ),
            ButtonSegment(
              value: 'ORIENTADOR',
              icon: Icon(Icons.workspace_premium_outlined),
              label: Text('Orientador'),
            ),
          ],
          selected: {_userType},
          onSelectionChanged: (selection) {
            setState(() => _userType = selection.first);
          },
        ),
        const SizedBox(height: 24),
        AppTextField(
          label: 'Nome completo',
          controller: _nameController,
          prefixIcon: Icons.person_outline,
          textInputAction: TextInputAction.next,
          validator: (value) => Validators.requiredField(value, label: 'Nome'),
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Email',
          controller: _emailController,
          prefixIcon: Icons.mail_outline,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          validator: Validators.email,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Senha',
          controller: _passwordController,
          prefixIcon: Icons.lock_outline,
          obscureText: true,
          textInputAction: TextInputAction.next,
          validator: Validators.password,
        ),
        const SizedBox(height: 16),
        AppTextField(
          label: 'Instituicao (opcional)',
          controller: _institutionController,
          prefixIcon: Icons.account_balance_outlined,
          textInputAction: TextInputAction.next,
        ),
        if (_userType == 'ALUNO') ...[
          const SizedBox(height: 16),
          AppTextField(
            label: 'RA',
            controller: _raController,
            prefixIcon: Icons.badge_outlined,
            textInputAction: TextInputAction.next,
            validator: (value) => Validators.requiredField(value, label: 'RA'),
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Semestre (opcional)',
            controller: _semesterController,
            prefixIcon: Icons.calendar_today_outlined,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            validator: (value) => Validators.positiveInteger(
              value,
              label: 'Semestre',
            ),
          ),
        ] else ...[
          const SizedBox(height: 16),
          AppTextField(
            label: 'Departamento',
            controller: _departmentController,
            prefixIcon: Icons.business_outlined,
            textInputAction: TextInputAction.next,
            validator: (value) =>
                Validators.requiredField(value, label: 'Departamento'),
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Titulacao',
            controller: _degreeController,
            prefixIcon: Icons.workspace_premium_outlined,
            textInputAction: TextInputAction.done,
            validator: (value) =>
                Validators.requiredField(value, label: 'Titulacao'),
          ),
        ],
        const SizedBox(height: 24),
        AppButton(
          key: const Key('register-submit'),
          label: 'Criar conta',
          isLoading: auth.isLoading,
          onPressed: _register,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => context.go('/login'),
          child: const Text('Já tenho conta'),
        ),
      ],
    );
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      final data = <String, dynamic>{
        'nome': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'senha': _passwordController.text,
        'tipo': _userType,
        'instituicao': _institutionController.text.trim(),
      };
      if (_userType == 'ALUNO') {
        data['ra'] = _raController.text.trim();
        final semester = int.tryParse(_semesterController.text.trim());
        if (semester != null) data['semestre'] = semester;
      } else {
        data['departamento'] = _departmentController.text.trim();
        data['titulacao'] = _degreeController.text.trim();
      }

      await context.read<AuthProvider>().register(data);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conta criada. Agora voce pode entrar.')),
      );
      context.go('/login');
    } on DioException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.instance.friendlyError(error))),
      );
    }
  }
}
