import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/academic/academic_widgets.dart';

class AdviseeDetailScreen extends StatefulWidget {
  const AdviseeDetailScreen({
    super.key,
    required this.studentId,
    this.projectId,
  });

  final String studentId;
  final String? projectId;

  @override
  State<AdviseeDetailScreen> createState() => _AdviseeDetailScreenState();
}

class _AdviseeDetailScreenState extends State<AdviseeDetailScreen> {
  String? _projectId;

  @override
  void initState() {
    super.initState();
    _projectId = widget.projectId;
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    await context.read<AcademicWorkspaceProvider>().loadAdvisee(
          widget.studentId,
          projectId: _projectId,
        );
    if (!mounted) return;
    final detail = context.read<AcademicWorkspaceProvider>().selectedAdvisee;
    setState(() {
      _projectId ??= detail?.selectedProject?.id ??
          detail?.summary.projects.firstOrNull?.id;
    });
  }

  Future<void> _message(AdviseeSummary advisee) async {
    final conversation = await context
        .read<ChatProvider>()
        .openPrivateConversation(advisee.userId);
    if (!mounted) return;
    if (conversation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível iniciar a conversa.')),
      );
      return;
    }
    context.push('/chat/${conversation.id}', extra: advisee.name);
  }

  @override
  Widget build(BuildContext context) {
    final academic = context.watch<AcademicWorkspaceProvider>();
    final detail = academic.selectedAdvisee;
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhe do orientando')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : 20.0;
            if (academic.isLoading && detail == null) {
              return ListView(
                padding: EdgeInsets.fromLTRB(horizontal, 24, horizontal, 24),
                children: const [AcademicSkeletonList(items: 4)],
              );
            }
            if (detail == null) {
              return ListView(
                padding: EdgeInsets.fromLTRB(horizontal, 24, horizontal, 24),
                children: [
                  AcademicErrorState(
                    message:
                        academic.errorMessage ?? 'Orientando não encontrado.',
                    onRetry: _load,
                  ),
                ],
              );
            }
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(horizontal, 16, horizontal, 32),
              children: [
                _ProfileSummary(
                  detail: detail,
                  onMessage: () => _message(detail.summary),
                ),
                if (detail.summary.projects.length > 1) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _projectId,
                    decoration: const InputDecoration(labelText: 'Projeto'),
                    items: [
                      for (final project in detail.summary.projects)
                        DropdownMenuItem(
                          value: project.id,
                          child: Text(project.title,
                              overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    onChanged: (value) async {
                      setState(() => _projectId = value);
                      await _load();
                    },
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Text('Progresso do projeto',
                          style: Theme.of(context).textTheme.titleMedium),
                    ),
                    Text('${detail.summary.progress.toStringAsFixed(0)}%'),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: detail.summary.progress.clamp(0, 100) / 100,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(8),
                ),
                const SizedBox(height: 22),
                Text('Etapas (${detail.stages.length})',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                if (detail.stages.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.route_outlined,
                    title: 'Nenhuma etapa definida',
                    description:
                        'As etapas do projeto selecionado aparecerão aqui.',
                  )
                else
                  for (final stage in detail.stages) ...[
                    _StageTile(stage: stage),
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

class _ProfileSummary extends StatelessWidget {
  const _ProfileSummary({required this.detail, required this.onMessage});

  final AdviseeDetail detail;
  final VoidCallback onMessage;

  @override
  Widget build(BuildContext context) {
    final user = detail.summary;
    final initials = user.name
        .split(RegExp(r'\s+'))
        .where((item) => item.isNotEmpty)
        .take(2)
        .map((item) => item[0].toUpperCase())
        .join();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            CircleAvatar(
              radius: 38,
              foregroundImage:
                  user.avatarUrl == null ? null : NetworkImage(user.avatarUrl!),
              child: Text(initials.isEmpty ? 'A' : initials),
            ),
            const SizedBox(height: 10),
            Text(user.name, style: Theme.of(context).textTheme.titleLarge),
            Text(
              [user.registrationNumber, user.course]
                  .whereType<String>()
                  .where((item) => item.isNotEmpty)
                  .join(' · '),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (detail.interests?.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              Text(detail.interests!, textAlign: TextAlign.center),
            ],
            const SizedBox(height: 14),
            FilledButton.tonalIcon(
              onPressed: onMessage,
              icon: const Icon(Icons.chat_bubble_outline),
              label: const Text('Enviar mensagem'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StageTile extends StatelessWidget {
  const _StageTile({required this.stage});

  final ProjectStage stage;

  @override
  Widget build(BuildContext context) {
    final deadline = stage.deadline == null
        ? 'Sem prazo'
        : '${stage.deadline!.day.toString().padLeft(2, '0')}/${stage.deadline!.month.toString().padLeft(2, '0')}/${stage.deadline!.year}';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                    child: Text(stage.title,
                        style: Theme.of(context).textTheme.titleSmall)),
                AcademicStatusBadge(stage.status),
              ],
            ),
            if (stage.description?.isNotEmpty == true) ...[
              const SizedBox(height: 6),
              Text(stage.description!,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: 10),
            Text('$deadline · Responsável: ${stage.responsible}'),
          ],
        ),
      ),
    );
  }
}
