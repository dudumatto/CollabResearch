import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/academic/academic_widgets.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_snackbar.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  String? _loadedForUserId;
  bool _initialized = false;

  String? get _userId => context.read<AuthProvider>().currentUser?.id;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // O token nao carrega o id: ele so aparece quando /usuarios/me responde.
    // Carregar de um addPostFrameCallback no initState pegava esse intervalo,
    // e _load() saia sem buscar nada e sem marcar erro -- a tela ficava presa
    // em "nenhum documento registrado", sem indicador e sem caminho de volta,
    // porque nada a fazia tentar de novo.
    //
    // Observando o AuthProvider, ela carrega assim que o id chega. Guardar o
    // id ja carregado evita repetir a busca a cada notificacao e recarrega
    // sozinho se a conta mudar.
    final userId = Provider.of<AuthProvider>(context).currentUser?.id;
    if (userId == null || userId.isEmpty) return;
    if (userId == _loadedForUserId) return;

    _loadedForUserId = userId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _load();
    });
  }

  Future<void> _load() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;
    await context.read<AcademicWorkspaceProvider>().loadDocuments(userId);
    if (!mounted) return;
    setState(() => _initialized = true);
  }

  Future<void> _delete(AcademicDocument document) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excluir documento?'),
        content: Text(
          '${document.name} será removido do seu perfil acadêmico.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final userId = _userId;
    if (userId == null) return;
    final academic = context.read<AcademicWorkspaceProvider>();
    final success = await academic.deleteDocument(document.id, userId);
    if (!mounted) return;
    if (success) {
      AppSnackbar.showSuccess(context, 'Documento excluído.');
    } else {
      AppSnackbar.showError(
        context,
        academic.errorMessage ?? 'Não foi possível excluir o documento.',
      );
    }
  }

  Future<void> _open(AcademicDocument document) async {
    final uri = document.externalUri;
    if (uri == null) {
      AppSnackbar.showError(
        context,
        'Este documento não possui um link externo.',
      );
      return;
    }
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      AppSnackbar.showError(context, 'Não foi possível abrir o documento.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final academic = context.watch<AcademicWorkspaceProvider>();
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
                  eyebrow: 'Perfil acadêmico',
                  title: 'Seus documentos',
                  description:
                      'Consulte os arquivos registrados no seu perfil e seus status.',
                ),
                const SizedBox(height: 18),
                if (!_initialized ||
                    (academic.isLoading && academic.documents.isEmpty))
                  const AcademicSkeletonList(items: 4)
                else if (academic.errorMessage != null &&
                    academic.documents.isEmpty)
                  AcademicErrorState(
                    message: academic.errorMessage!,
                    onRetry: _load,
                  )
                else if (academic.documents.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.description_outlined,
                    title: 'Nenhum documento registrado',
                    description:
                        'Os documentos acadêmicos vinculados ao perfil aparecerão aqui.',
                  )
                else
                  for (final document in academic.documents) ...[
                    _DocumentTile(
                      document: document,
                      onOpen: () => _open(document),
                      onDelete: () => _delete(document),
                    ),
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

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({
    required this.document,
    required this.onOpen,
    required this.onDelete,
  });

  final AcademicDocument document;
  final VoidCallback onOpen;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final sentAt = document.sentAt == null
        ? 'Data não informada'
        : '${document.sentAt!.day.toString().padLeft(2, '0')}/${document.sentAt!.month.toString().padLeft(2, '0')}/${document.sentAt!.year}';
    final hasExternalUrl = document.externalUri != null;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.description_outlined),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        document.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${document.type} · $sentAt',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                AcademicStatusBadge(document.status),
                TextButton.icon(
                  onPressed: hasExternalUrl ? onOpen : null,
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: Text(hasExternalUrl ? 'Abrir' : 'Link indisponível'),
                ),
                IconButton(
                  tooltip: 'Excluir documento',
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
