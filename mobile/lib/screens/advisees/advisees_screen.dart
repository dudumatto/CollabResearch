import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_avatar.dart';

class AdviseesScreen extends StatefulWidget {
  const AdviseesScreen({super.key});

  @override
  State<AdviseesScreen> createState() => _AdviseesScreenState();
}

class _AdviseesScreenState extends State<AdviseesScreen> {
  final _searchController = TextEditingController();
  String _situation = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() =>
      context.read<AcademicWorkspaceProvider>().loadAdvisees(
            situation: _situation.isEmpty ? null : _situation,
          );

  List<AdviseeSummary> _filtered(List<AdviseeSummary> items) {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return items;
    return items.where((item) {
      return item.name.toLowerCase().contains(query) ||
          (item.email ?? '').toLowerCase().contains(query) ||
          (item.registrationNumber ?? '').toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final academic = context.watch<AcademicWorkspaceProvider>();
    final advisees = _filtered(academic.advisees);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : 20.0;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                horizontal,
                MediaQuery.paddingOf(context).top + 16,
                horizontal, 32),
              children: [
                AppPageHeader(
                  onBack: () => context.canPop()
                      ? context.pop()
                      : context.go('/dashboard'),
                  eyebrow: 'Orientação',
                  title: 'Acompanhe seus orientandos',
                  description:
                      'Consulte progresso, vínculos e pendências de cada estudante.',
                ),
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: 'Buscar por nome, RA ou e-mail',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Limpar busca',
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                            icon: const Icon(Icons.close),
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: '', label: Text('Todos')),
                      ButtonSegment(
                          value: 'EM_ANDAMENTO', label: Text('Em andamento')),
                      ButtonSegment(value: 'ABERTO', label: Text('Ativos')),
                      ButtonSegment(
                          value: 'FINALIZADO', label: Text('Finalizados')),
                    ],
                    selected: {_situation},
                    onSelectionChanged: (value) async {
                      setState(() => _situation = value.first);
                      await _load();
                    },
                  ),
                ),
                const SizedBox(height: 20),
                if (academic.isLoading && academic.advisees.isEmpty)
                  const AcademicSkeletonList(items: 5)
                else if (academic.errorMessage != null &&
                    academic.advisees.isEmpty)
                  AcademicErrorState(
                    message: academic.errorMessage!,
                    onRetry: _load,
                  )
                else if (advisees.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.group_outlined,
                    title: 'Nenhum orientando encontrado',
                    description:
                        'Alunos com inscrição aprovada aparecerão nesta lista.',
                  )
                else
                  for (final advisee in advisees) ...[
                    _AdviseeTile(advisee: advisee),
                    const SizedBox(height: 10),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AdviseeTile extends StatelessWidget {
  const _AdviseeTile({required this.advisee});

  final AdviseeSummary advisee;

  String get _initials => advisee.name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();

  @override
  Widget build(BuildContext context) {
    final progress = advisee.progress.clamp(0, 100) / 100;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/advisees/${advisee.studentId}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppAvatar(
                name: advisee.name,
                imageUrl: advisee.avatarUrl,
                radius: 24,
                initials: _initials.isEmpty ? 'A' : _initials,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(advisee.name,
                              style: Theme.of(context).textTheme.titleSmall),
                        ),
                        AcademicStatusBadge(advisee.situation),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [advisee.registrationNumber, advisee.course]
                          .whereType<String>()
                          .where((item) => item.isNotEmpty)
                          .join(' · '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                            child: LinearProgressIndicator(value: progress)),
                        const SizedBox(width: 10),
                        Text('${advisee.progress.toStringAsFixed(0)}%'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${advisee.projects.length} vínculo(s) · ${advisee.pendingItems} pendência(s)',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
