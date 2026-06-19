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
  String _theme = 'sistema';
  bool _savingPassword = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().currentUser;
    _notificationsEnabled = user?.notificationsEnabled ?? true;
    _theme = user?.theme?.isNotEmpty == true ? user!.theme! : 'sistema';
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
    final current = _currentPasswordController.text.trim();
    final next = _newPasswordController.text.trim();
    final confirmation = _confirmPasswordController.text.trim();

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
                  subtitle: const Text('Receber alertas em tempo real'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _theme,
                  decoration: const InputDecoration(
                    labelText: 'Tema',
                    prefixIcon: Icon(Icons.palette_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'sistema', child: Text('Sistema')),
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
                TextField(
                  controller: _currentPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Senha atual',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _newPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Nova senha',
                    prefixIcon: Icon(Icons.lock_reset_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Confirmar nova senha',
                    prefixIcon: Icon(Icons.verified_user_outlined),
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
