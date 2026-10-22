import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_page_header.dart';

/// Area academica: atalhos (agenda, inscricoes, entregas, avaliacoes...) e os
/// dados academicos do usuario vindos do backend (/usuarios/me).
class AcademicAreaScreen extends StatefulWidget {
  const AcademicAreaScreen({super.key});

  @override
  State<AcademicAreaScreen> createState() => _AcademicAreaScreenState();
}

class _AcademicAreaScreenState extends State<AcademicAreaScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      auth.refreshProfile();
      // Contador de pendentes no atalho de Inscricoes (orientador).
      if (_isAdvisor(auth.currentUser)) {
        context.read<SubscriptionProvider>().loadForAdvisor();
      }
    });
  }

  static bool _isAdvisor(User? user) =>
      (user?.type ?? (user?.roles.isNotEmpty == true ? user!.roles.first : ''))
          .toUpperCase() ==
      'ORIENTADOR';

  void _goBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final advisor = _isAdvisor(user);
    final pending = advisor
        ? context
            .watch<SubscriptionProvider>()
            .subscriptions
            .where((s) => s.status.toUpperCase() == 'PENDENTE')
            .length
        : 0;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: auth.refreshProfile,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            16,
            MediaQuery.paddingOf(context).top + 16,
            16,
            AppSpacing.xl + MediaQuery.paddingOf(context).bottom,
          ),
          children: [
            AppPageHeader(
              onBack: _goBack,
              eyebrow: 'Acadêmico',
              title: 'Área acadêmica',
              description: advisor
                  ? 'Revise entregas, inscrições e avaliações da equipe.'
                  : 'Acompanhe seus prazos, entregas e avaliações.',
            ),
            if (user != null) ...[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoRow(label: 'Instituição', value: user.institution),
                    _InfoRow(
                      label: 'Semestre',
                      value: user.semester != null ? '${user.semester}º' : null,
                    ),
                    Text('Biografia', style: textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Text(
                      user.bio?.trim().isNotEmpty == true
                          ? user.bio!
                          : 'Biografia não informada.',
                      style: textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            AppCard(
              child: Column(
                children: [
                  AcademicActionTile(
                    icon: Icons.event_note_outlined,
                    title: 'Agenda',
                    description: 'Etapas e prazos dos projetos.',
                    onTap: () => context.push('/agenda'),
                  ),
                  const SizedBox(height: 8),
                  AcademicActionTile(
                    icon: Icons.how_to_reg_outlined,
                    title: 'Inscrições',
                    description: advisor
                        ? 'Analise candidaturas e use a Lumen AI.'
                        : 'Acompanhe seus pedidos de participação.',
                    badge: pending > 0 ? '$pending' : null,
                    onTap: () => context.push('/subscriptions'),
                  ),
                  const SizedBox(height: 8),
                  AcademicActionTile(
                    icon: Icons.upload_file_outlined,
                    title: 'Entregas',
                    description: advisor
                        ? 'Arquivos aguardando revisão.'
                        : 'Arquivos enviados e novas versões.',
                    onTap: () => context.push('/deliveries'),
                  ),
                  const SizedBox(height: 8),
                  AcademicActionTile(
                    icon: Icons.fact_check_outlined,
                    title: 'Avaliações',
                    description: advisor
                        ? 'Notas por etapa e ciência dos alunos.'
                        : 'Notas e comentários do orientador.',
                    onTap: () => context.push('/evaluations'),
                  ),
                  const SizedBox(height: 8),
                  if (advisor)
                    AcademicActionTile(
                      icon: Icons.groups_outlined,
                      title: 'Orientandos',
                      description: 'Progresso e pendências dos estudantes.',
                      onTap: () => context.push('/advisees'),
                    )
                  else
                    AcademicActionTile(
                      icon: Icons.description_outlined,
                      title: 'Documentos',
                      description: 'Arquivos vinculados ao perfil acadêmico.',
                      onTap: () => context.push('/documents'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final empty = value == null || value!.trim().isEmpty;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(
              empty ? 'Não informado' : value!,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
