import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';

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

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Cadastro', style: Theme.of(context).textTheme.displaySmall),
                  const SizedBox(height: 24),
                  AppTextField(
                    label: 'Nome',
                    controller: _nameController,
                    validator: (value) => Validators.requiredField(value, label: 'Nome'),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Senha',
                    controller: _passwordController,
                    obscureText: true,
                    validator: (value) => Validators.requiredField(value, label: 'Senha'),
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: 'Criar conta',
                    onPressed: () async {
                      if (!_formKey.currentState!.validate()) return;
                      try {
                        await context.read<AuthProvider>().register({
                          'nome': _nameController.text.trim(),
                          'email': _emailController.text.trim(),
                          'senha': _passwordController.text.trim(),
                        });
                        if (context.mounted) {
                          context.go('/login');
                        }
                      } on DioException catch (error) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(ApiClient.instance.friendlyError(error))),
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Já tenho conta'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
