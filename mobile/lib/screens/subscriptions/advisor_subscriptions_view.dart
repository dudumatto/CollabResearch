import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/subscription.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/common/app_avatar.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_dropdown.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_snackbar.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/lumen_loading_dialog.dart';

const _filters = <(String, String)>[
  ('todas', 'Todas'),
  ('PENDENTE', 'Pendentes'),
  ('APROVADO', 'Aprovadas'),
  ('REJEITADO', 'Rejeitadas'),
];

const _lumenHint =
    'Atribui nota de 0 a 10 às inscrições pendentes conforme a compatibilidade '
    'com o projeto. A nota é só uma sugestão.';

/// Inscricoes na visao do orientador: mesmas acoes e regras do web
/// (AdvisorApplicationsPage), em layout mobile.
class AdvisorSubscriptionsView extends StatefulWidget {
  const AdvisorSubscriptionsView({super.key, required this.onBack});

  final VoidCallback onBack;

  @override
  State<AdvisorSubscriptionsView> createState() =>
      _AdvisorSubscriptionsViewState();
}

class _AdvisorSubscriptionsViewState extends State<AdvisorSubscriptionsView> {
  String _filter = 'todas';
  String _projectId = '';
  bool _selecting = false;
  final Set<String> _selected = {};
  final Set<String> _expanded = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SubscriptionProvider>().loadForAdvisor();
    });
  }

  List<({String id, String title})> _projects(List<Subscription> all) {
    final seen = <String, String>{};
    for (final item in all) {
      if (item.projectId.isNotEmpty) {
        seen.putIfAbsent(item.projectId, () => item.projectTitle);
      }
    }
    return [for (final e in seen.entries) (id: e.key, title: e.value)];
  }

  List<Subscription> _visible(List<Subscription> all) {
    final list = all.where((s) {
      final byStatus =
          _filter == 'todas' || s.status.toUpperCase() == _filter;
      final byProject = _projectId.isEmpty || s.projectId == _projectId;
      return byStatus && byProject;
    }).toList();
    if (list.any((s) => s.lumenScore != null)) {
      list.sort((a, b) => (b.lumenDisplayScore ?? -1)
          .compareTo(a.lumenDisplayScore ?? -1));
    }
    return list;
  }

  bool _isPending(Subscription s) => s.status.toUpperCase() == 'PENDENTE';

  Future<void> _analyze(
    SubscriptionProvider provider,
    String projectId, {
    List<String> ids = const [],
  }) async {
    setState(() {
      _selecting = false;
      _selected.clear();
    });
    var dialogOpen = true;
    LumenLoadingDialog.show(context).then((_) => dialogOpen = false);
    final ok = await provider.rank(projectId, ids: ids);
    if (!mounted) return;
    if (dialogOpen) Navigator.of(context, rootNavigator: true).pop();
    if (ok) {
      final scored = provider.subscriptions
          .where((s) => s.projectId == projectId && s.lumenScore != null)
          .toList()
        ..sort((a, b) => (b.lumenDisplayScore ?? -1)
            .compareTo(a.lumenDisplayScore ?? -1));
      AppSnackbar.showSuccess(context, 'Avaliação da Lumen concluída.');
      if (scored.isNotEmpty) _showLumen(scored);
    } else {
      AppSnackbar.showError(
        context,
        provider.lumenNotice ??
            provider.errorMessage ??
            'Não foi possível analisar com a Lumen.',
      );
    }
  }

  Future<void> _decide(
    SubscriptionProvider provider,
    Subscription item, {
    required bool approve,
  }) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(approve ? 'Aprovar inscrição' : 'Rejeitar inscrição'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.studentName ?? 'Estudante'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Parecer do orientador (opcional)',
                hintText: 'Escreva um comentário para o aluno...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: approve
                ? null
                : FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: Text(approve ? 'Aprovar inscrição' : 'Rejeitar inscrição'),
          ),
        ],
      ),
    );
    final opinion = controller.text;
    controller.dispose();
    if (confirmed != true || !mounted) return;
    final ok = await provider.review(item.id, approve: approve, opinion: opinion);
    if (!mounted) return;
    if (ok) {
      AppSnackbar.showSuccess(
          context, approve ? 'Inscrição aprovada.' : 'Inscrição rejeitada.');
    } else {
      AppSnackbar.showError(context,
          provider.errorMessage ?? 'Não foi possível concluir a ação.');
    }
  }

  void _showLumen(List<Subscription> scored, {String? focusId}) {
    final shown =
        focusId == null ? scored : scored.where((s) => s.id == focusId);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        builder: (context, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            Row(children: [
              const Icon(Icons.auto_awesome),
              const SizedBox(width: 8),
              Text(focusId != null ? 'Avaliação da Lumen' : 'Sugestão da Lumen',
                  style: Theme.of(context).textTheme.titleLarge),
            ]),
            const SizedBox(height: 4),
            Text('Análise de compatibilidade com o projeto',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            for (final (i, s) in shown.indexed) ...[
              _LumenResultCard(position: i + 1, item: s),
              const SizedBox(height: 12),
            ],
            Text(
              'Sugestão gerada por IA. A decisão final é sempre do orientador.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SubscriptionProvider>();
    final all = provider.subscriptions;
    final projects = _projects(all);
    final visible = _visible(all);
    final scored = visible.where((s) => s.lumenScore != null).toList();
    final pendingOfProject = _projectId.isEmpty
        ? const <Subscription>[]
        : all.where((s) => _isPending(s) && s.projectId == _projectId).toList();
    final unavailable = _projectId.isEmpty
        ? 'Selecione um projeto para analisar com a Lumen.'
        : pendingOfProject.isEmpty
            ? 'Este projeto não tem inscrições pendentes para analisar.'
            : null;
    final busy = provider.isRanking || provider.isActionLoading;

    int count(String key) => key == 'todas'
        ? all.length
        : all.where((s) => s.status.toUpperCase() == key).length;

    return provider.isLoading && all.isEmpty
        ? const LoadingIndicator(label: 'Carregando inscrições...')
        : RefreshIndicator(
            onRefresh: provider.loadForAdvisor,
            child: ListView(
              padding: EdgeInsets.fromLTRB(
                20,
                MediaQuery.paddingOf(context).top + 16,
                20,
                20,
              ),
              children: [
                AppPageHeader(
                  onBack: widget.onBack,
                  eyebrow: 'Candidaturas',
                  title: 'Inscrições',
                  description:
                      'Revise as inscrições dos alunos nos seus projetos e aprove ou rejeite com um parecer.',
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(children: [
                    for (final (key, label) in _filters) ...[
                      ChoiceChip(
                        label: Text('$label (${count(key)})'),
                        selected: _filter == key,
                        onSelected: (_) => setState(() => _filter = key),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ]),
                ),
                if (projects.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  AppDropdown<String>(
                    label: 'Filtrar por projeto',
                    icon: Icons.folder_outlined,
                    value: _projectId,
                    items: [
                      const AppDropdownItem(
                          value: '', label: 'Todos os projetos'),
                      for (final p in projects)
                        AppDropdownItem(value: p.id, label: p.title),
                    ],
                    onChanged: (v) => setState(() {
                      _projectId = v ?? '';
                      _selecting = false;
                      _selected.clear();
                    }),
                  ),
                  const SizedBox(height: 12),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    if (!_selecting)
                      FilledButton.icon(
                        onPressed: busy || unavailable != null
                            ? null
                            : () => _analyze(provider, _projectId),
                        icon: const Icon(Icons.auto_awesome),
                        label: Text(provider.isRanking
                            ? 'Analisando...'
                            : pendingOfProject.any((s) => s.lumenScore != null)
                                ? 'Avaliar novos com Lumen'
                                : 'Analisar com Lumen'),
                      ),
                    if (_selecting) ...[
                      FilledButton.icon(
                        onPressed: busy || _selected.isEmpty
                            ? null
                            : () => _analyze(provider, _projectId,
                                ids: _selected.toList()),
                        icon: const Icon(Icons.auto_awesome),
                        label: Text(
                            'Reavaliar selecionados (${_selected.length})'),
                      ),
                      OutlinedButton(
                        onPressed: () => setState(() {
                          _selecting = false;
                          _selected.clear();
                        }),
                        child: const Text('Cancelar'),
                      ),
                    ] else
                      OutlinedButton(
                        onPressed: busy || unavailable != null
                            ? null
                            : () => setState(() {
                                  _filter = 'PENDENTE';
                                  _selecting = true;
                                }),
                        child: const Text('Selecionar para reavaliar'),
                      ),
                    if (scored.isNotEmpty)
                      OutlinedButton(
                        onPressed: () => _showLumen(scored),
                        child: const Text('Ver últimas avaliações da Lumen'),
                      ),
                  ]),
                  const SizedBox(height: 8),
                  Text(unavailable ?? _lumenHint,
                      style: Theme.of(context).textTheme.bodySmall),
                  if (provider.isRanking) ...[
                    const SizedBox(height: 8),
                    const LinearProgressIndicator(),
                  ],
                ],
                const SizedBox(height: 12),
                if (provider.errorMessage != null &&
                    !provider.isRanking &&
                    all.isEmpty)
                  Text(provider.errorMessage!,
                      style:
                          TextStyle(color: Theme.of(context).colorScheme.error))
                else if (visible.isEmpty)
                  const SizedBox(
                    height: 320,
                    child: EmptyState(
                      title: 'Nenhuma inscrição encontrada',
                      subtitle:
                          'Quando um aluno se inscrever nos seus projetos, as inscrições aparecerão aqui.',
                    ),
                  )
                else
                  for (final item in visible) ...[
                    _AdvisorCard(
                      item: item,
                      busy: busy,
                      selectable: _selecting && _isPending(item),
                      selected: _selected.contains(item.id),
                      expanded: _expanded.contains(item.id),
                      onToggleSelected: () => setState(() {
                        if (!_selected.add(item.id)) _selected.remove(item.id);
                      }),
                      onToggleMotivation: () => setState(() {
                        if (!_expanded.add(item.id)) _expanded.remove(item.id);
                      }),
                      onLumenDetail: () => _showLumen(
                          all.where((s) => s.lumenScore != null).toList(),
                          focusId: item.id),
                      onEvaluate: () => _analyze(provider, item.projectId,
                          ids: [item.id]),
                      onProfile: () {
                        final uid = item.studentUserId ?? item.studentId;
                        if (uid != null) context.push('/users/$uid');
                      },
                      onProject: () =>
                          context.push('/projects/${item.projectId}'),
                      onApprove: () => _decide(provider, item, approve: true),
                      onReject: () => _decide(provider, item, approve: false),
                      selecting: _selecting,
                    ),
                    const SizedBox(height: 12),
                  ],
              ],
            ),
          );
  }
}

Color _scoreColor(num score) => score >= 7
    ? AppColors.success
    : score >= 4
        ? AppColors.warning
        : AppColors.danger;

class _AdvisorCard extends StatelessWidget {
  const _AdvisorCard({
    required this.item,
    required this.busy,
    required this.selectable,
    required this.selected,
    required this.expanded,
    required this.selecting,
    required this.onToggleSelected,
    required this.onToggleMotivation,
    required this.onLumenDetail,
    required this.onEvaluate,
    required this.onProfile,
    required this.onProject,
    required this.onApprove,
    required this.onReject,
  });

  final Subscription item;
  final bool busy;
  final bool selectable;
  final bool selected;
  final bool expanded;
  final bool selecting;
  final VoidCallback onToggleSelected;
  final VoidCallback onToggleMotivation;
  final VoidCallback onLumenDetail;
  final VoidCallback onEvaluate;
  final VoidCallback onProfile;
  final VoidCallback onProject;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final pending = item.status.toUpperCase() == 'PENDENTE';
    final score = item.lumenDisplayScore;
    final name = item.studentName ?? 'Estudante';
    final canOpenProfile = (item.studentUserId ?? item.studentId) != null;
    return AppCard(
      child: InkWell(
        onTap: selectable ? onToggleSelected : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (selectable)
                  Checkbox(
                    value: selected,
                    onChanged: (_) => onToggleSelected(),
                  ),
                AppAvatar(
                  name: name,
                  imageUrl: item.studentAvatarUrl,
                  radius: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: Theme.of(context).textTheme.titleMedium),
                      Text(
                        [
                          item.projectTitle,
                          if (item.createdAt != null)
                            DateUtilsX.relative(item.createdAt!),
                        ].join(' · '),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 4, children: [
              AppBadge(
                label: _statusLabel(item.status),
                color: _statusColor(item.status),
              ),
              if (score != null)
                ActionChip(
                  avatar: const Icon(Icons.auto_awesome, size: 14),
                  label: Text('Lumen: $score/10'),
                  side: BorderSide(color: _scoreColor(score)),
                  onPressed: onLumenDetail,
                ),
              if (item.advisorOpinion != null)
                const AppBadge(label: 'Com parecer'),
            ]),
            if (item.motivation != null) ...[
              TextButton.icon(
                onPressed: onToggleMotivation,
                icon: const Icon(Icons.description_outlined, size: 16),
                label: Text(expanded ? 'Ocultar motivação' : 'Ver motivação'),
              ),
              if (expanded) Text(item.motivation!),
            ],
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (pending && !selecting && item.projectId.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: busy ? null : onEvaluate,
                  icon: const Icon(Icons.auto_awesome, size: 16),
                  label: Text(item.lumenScore != null ? 'Reavaliar' : 'Avaliar'),
                ),
              if (canOpenProfile)
                OutlinedButton.icon(
                  onPressed: onProfile,
                  icon: const Icon(Icons.person_outline, size: 16),
                  label: const Text('Ver perfil do aluno'),
                ),
              if (pending) ...[
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                      backgroundColor: AppColors.success),
                  onPressed: busy ? null : onApprove,
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Aprovar'),
                ),
                FilledButton.icon(
                  style:
                      FilledButton.styleFrom(backgroundColor: AppColors.danger),
                  onPressed: busy ? null : onReject,
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Rejeitar'),
                ),
              ],
              if (item.projectId.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: onProject,
                  icon: const Icon(Icons.chevron_right, size: 16),
                  label: const Text('Projeto'),
                ),
            ]),
          ],
        ),
      ),
    );
  }

  static String _statusLabel(String status) => switch (status.toUpperCase()) {
        'PENDENTE' => 'Pendente',
        'APROVADO' => 'Aprovada',
        'REJEITADO' => 'Rejeitada',
        _ => status,
      };

  static Color _statusColor(String status) => switch (status.toUpperCase()) {
        'APROVADO' => AppColors.success,
        'REJEITADO' => AppColors.danger,
        _ => AppColors.warning,
      };
}

class _LumenResultCard extends StatelessWidget {
  const _LumenResultCard({required this.position, required this.item});

  final int position;
  final Subscription item;

  @override
  Widget build(BuildContext context) {
    final eval = item.lumenEvaluation;
    final criteria = eval?['criterios'];
    final confidence = switch ('${eval?['confianca'] ?? 'medio'}') {
      'alto' => 'Confiança alta',
      'baixo' => 'Confiança baixa',
      _ => 'Confiança média',
    };
    final score = item.lumenDisplayScore ?? 0;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text('${position}º ',
                style: Theme.of(context).textTheme.titleMedium),
            Expanded(
              child: Text(item.studentName ?? 'Estudante',
                  style: Theme.of(context).textTheme.titleMedium),
            ),
            AppBadge(label: '$score/10', color: _scoreColor(score)),
          ]),
          if (item.lumenJustification != null) ...[
            const SizedBox(height: 8),
            Text(item.lumenJustification!),
          ],
          if (eval != null) ...[
            const SizedBox(height: 8),
            AppBadge(label: confidence),
            if (criteria is List)
              for (final c in criteria.whereType<Map>()) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(child: Text('${c['nome']} (${c['peso']}%)')),
                  Text(c['nota'] != null ? '${c['nota']}/10' : 'sem dados',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ]),
                if ('${c['justificativa'] ?? ''}'.isNotEmpty)
                  Text('${c['justificativa']}',
                      style: Theme.of(context).textTheme.bodySmall),
              ],
            ..._bullets(context, 'Pontos fortes', eval['pontosFortes']),
            ..._bullets(context, 'Pontos de atenção', eval['pontosAtencao']),
          ],
        ],
      ),
    );
  }

  List<Widget> _bullets(BuildContext context, String title, dynamic items) {
    if (items is! List || items.isEmpty) return const [];
    return [
      const SizedBox(height: 8),
      Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      for (final i in items) Text('• $i'),
    ];
  }
}
