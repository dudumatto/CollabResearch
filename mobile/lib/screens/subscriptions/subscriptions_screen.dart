import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/subscription.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';

class SubscriptionsScreen extends StatefulWidget {
  const SubscriptionsScreen({super.key});

  @override
  State<SubscriptionsScreen> createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SubscriptionProvider>().load();
    });
  }

  Future<void> _review(
    SubscriptionProvider provider,
    Subscription subscription, {
    required bool approve,
  }) async {
    final success = await provider.review(subscription.id, approve: approve);
    if (!mounted) return;
    _showMessage(
      success
          ? approve
              ? 'Inscricao aprovada.'
              : 'Inscricao recusada.'
          : provider.errorMessage ?? 'Nao foi possivel analisar a inscricao.',
    );
  }

  Future<void> _cancel(
    SubscriptionProvider provider,
    Subscription subscription,
  ) async {
    final success = await provider.cancel(subscription.id);
    if (!mounted) return;
    _showMessage(
      success
          ? 'Inscricao cancelada.'
          : provider.errorMessage ?? 'Nao foi possivel cancelar a inscricao.',
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SubscriptionProvider>();
    final user = context.watch<AuthProvider>().currentUser;
    final userType = (user?.type ??
            (user?.roles.isNotEmpty == true ? user!.roles.first : ''))
        .toUpperCase();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _goBack,
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Voltar',
        ),
        title: const Text('Inscricoes'),
      ),
      body: provider.isLoading && provider.subscriptions.isEmpty
          ? const LoadingIndicator(label: 'Carregando inscricoes...')
          : RefreshIndicator(
              onRefresh: provider.load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  if (provider.errorMessage != null) ...[
                    Text(
                      provider.errorMessage!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (provider.subscriptions.isEmpty)
                    const SizedBox(
                      height: 360,
                      child: EmptyState(
                        title: 'Nenhuma inscricao',
                        subtitle:
                            'As inscricoes dos seus projetos aparecerao aqui.',
                      ),
                    )
                  else
                    for (final subscription in provider.subscriptions) ...[
                      _SubscriptionCard(
                        subscription: subscription,
                        userType: userType,
                        isLoading: provider.isLoading,
                        onOpenProject: () =>
                            context.go('/projects/${subscription.projectId}'),
                        onApprove: () => _review(
                          provider,
                          subscription,
                          approve: true,
                        ),
                        onReject: () => _review(
                          provider,
                          subscription,
                          approve: false,
                        ),
                        onCancel: () => _cancel(provider, subscription),
                      ),
                      const SizedBox(height: 12),
                    ],
                ],
              ),
            ),
    );
  }
}

class _SubscriptionCard extends StatelessWidget {
  const _SubscriptionCard({
    required this.subscription,
    required this.userType,
    required this.isLoading,
    required this.onOpenProject,
    required this.onApprove,
    required this.onReject,
    required this.onCancel,
  });

  final Subscription subscription;
  final String userType;
  final bool isLoading;
  final VoidCallback onOpenProject;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final pending = subscription.status.toUpperCase() == 'PENDENTE';
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  subscription.projectTitle,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const SizedBox(width: 8),
              AppBadge(
                label: _statusLabel(subscription.status),
                color: _statusColor(subscription.status),
              ),
            ],
          ),
          if (subscription.studentName != null) ...[
            const SizedBox(height: 8),
            Text('Aluno: ${subscription.studentName}'),
          ],
          if (subscription.motivation != null) ...[
            const SizedBox(height: 8),
            Text(subscription.motivation!),
          ],
          if (subscription.createdAt != null) ...[
            const SizedBox(height: 8),
            Text(
              DateUtilsX.relative(subscription.createdAt!),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: onOpenProject,
                icon: const Icon(Icons.open_in_new),
                label: const Text('Abrir projeto'),
              ),
              if (userType == 'ORIENTADOR' && pending) ...[
                FilledButton(
                  onPressed: isLoading ? null : onApprove,
                  child: const Text('Aprovar'),
                ),
                OutlinedButton(
                  onPressed: isLoading ? null : onReject,
                  child: const Text('Recusar'),
                ),
              ],
              if (userType == 'ALUNO')
                TextButton(
                  onPressed: isLoading ? null : onCancel,
                  child: const Text('Cancelar inscricao'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  static String _statusLabel(String status) {
    return switch (status.toUpperCase()) {
      'PENDENTE' => 'Pendente',
      'APROVADO' => 'Aprovada',
      'REJEITADO' => 'Recusada',
      _ => status,
    };
  }

  static Color _statusColor(String status) {
    return switch (status.toUpperCase()) {
      'APROVADO' => AppColors.success,
      'REJEITADO' => AppColors.danger,
      _ => AppColors.warning,
    };
  }
}
