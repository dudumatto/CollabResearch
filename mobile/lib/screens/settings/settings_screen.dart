import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/common/app_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _notificationsEnabled = true;
  String _theme = 'claro';
  bool _savingPassword = false;
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showPasswordConfirmation = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().currentUser;
    _notificationsEnabled = user?.notificationsEnabled ?? true;
    _theme = user?.theme?.toLowerCase() == 'escuro' ? 'escuro' : 'claro';
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go('/profile');
  }

  Future<void> _saveSettings() async {
    final auth = context.read<AuthProvider>();
    try {
      await auth.updatePreferences(
        notificationsEnabled: _notificationsEnabled,
        theme: _theme,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Configuracoes salvas.')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Nao foi possivel salvar as configuracoes.')),
      );
    }
  }

  Future<void> _changePassword() async {
    final current = _currentPasswordController.text;
    final next = _newPasswordController.text;
    final confirmation = _confirmPasswordController.text;

    if (current.isEmpty || next.isEmpty || confirmation.isEmpty) {
      _showMessage('Preencha todos os campos de senha.');
      return;
    }
    if (next.length < 8) {
      _showMessage('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (next != confirmation) {
      _showMessage('A confirmacao de senha nao confere.');
      return;
    }

    setState(() => _savingPassword = true);
    try {
      await context.read<AuthProvider>().changePassword(current, next);
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _showMessage('Senha alterada com sucesso.');
    } catch (_) {
      _showMessage('Nao foi possivel alterar a senha.');
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _goBack,
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Voltar',
        ),
        title: const Text('Configuracoes'),
        actions: [
          TextButton.icon(
            onPressed: auth.isLoading ? null : _saveSettings,
            icon: const Icon(Icons.save_outlined),
            label: const Text('Salvar'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Preferencias',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _notificationsEnabled,
                  onChanged: (value) =>
                      setState(() => _notificationsEnabled = value),
                  title: const Text('Notificacoes'),
                  subtitle: const Text('Receber alertas do sistema'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _theme,
                  decoration: const InputDecoration(
                    labelText: 'Tema',
                    prefixIcon: Icon(Icons.palette_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'claro', child: Text('Claro')),
                    DropdownMenuItem(value: 'escuro', child: Text('Escuro')),
                  ],
                  onChanged: (value) =>
                      setState(() => _theme = value ?? _theme),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Alterar senha',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                _PasswordField(
                  controller: _currentPasswordController,
                  label: 'Senha atual',
                  icon: Icons.lock_outline,
                  visible: _showCurrentPassword,
                  onToggleVisibility: () => setState(
                    () => _showCurrentPassword = !_showCurrentPassword,
                  ),
                ),
                const SizedBox(height: 12),
                _PasswordField(
                  controller: _newPasswordController,
                  label: 'Nova senha',
                  icon: Icons.lock_reset_outlined,
                  visible: _showNewPassword,
                  onToggleVisibility: () => setState(
                    () => _showNewPassword = !_showNewPassword,
                  ),
                ),
                const SizedBox(height: 12),
                _PasswordField(
                  controller: _confirmPasswordController,
                  label: 'Confirmar nova senha',
                  icon: Icons.verified_user_outlined,
                  visible: _showPasswordConfirmation,
                  onToggleVisibility: () => setState(
                    () =>
                        _showPasswordConfirmation = !_showPasswordConfirmation,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _savingPassword ? null : _changePassword,
                    icon: _savingPassword
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.password_outlined),
                    label: Text(
                        _savingPassword ? 'Alterando...' : 'Alterar senha'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              children: [
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.info_outline),
                  title: Text('Sobre o app'),
                  subtitle: Text('CollabResearch v1.0.0'),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.logout),
                  title: const Text('Sair da conta'),
                  onTap: () async {
                    await context.read<AuthProvider>().logout();
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.controller,
    required this.label,
    required this.icon,
    required this.visible,
    required this.onToggleVisibility,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool visible;
  final VoidCallback onToggleVisibility;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: !visible,
      enableSuggestions: false,
      autocorrect: false,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        suffixIcon: IconButton(
          onPressed: onToggleVisibility,
          icon: Icon(visible ? Icons.visibility_off : Icons.visibility),
          tooltip: visible ? 'Ocultar senha' : 'Mostrar senha',
        ),
      ),
    );
  }
}
