import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/user.dart';
import '../../models/academic_workspace.dart';
import '../../providers/academic_workspace_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/academic/academic_widgets.dart';

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key, required this.userId});

  final String userId;

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() =>
      context.read<AcademicWorkspaceProvider>().loadUserProfile(widget.userId);

  Future<void> _message(User user) async {
    final conversation =
        await context.read<ChatProvider>().openPrivateConversation(user.id);
    if (!mounted) return;
    if (conversation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível iniciar a conversa.')),
      );
      return;
    }
    context.push('/chat/${conversation.id}', extra: user.name);
  }

  Future<void> _openDocument(String? url) async {
    final uri = Uri.tryParse(url ?? '');
    if (uri == null || (uri.scheme != 'http' && uri.scheme != 'https')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Link externo indisponível.')),
      );
      return;
    }
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível abrir o documento.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final academic = context.watch<AcademicWorkspaceProvider>();
    final user = academic.selectedUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth > 760
                ? (constraints.maxWidth - 720) / 2
                : 20.0;
            if (academic.isLoading && user == null) {
              return ListView(
                padding: EdgeInsets.fromLTRB(horizontal, 24, horizontal, 24),
                children: const [AcademicSkeletonList(items: 4)],
              );
            }
            if (user == null) {
              return ListView(
                padding: EdgeInsets.fromLTRB(horizontal, 24, horizontal, 24),
                children: [
                  AcademicErrorState(
                    message: academic.errorMessage ?? 'Perfil indisponível.',
                    onRetry: _load,
                  ),
                ],
              );
            }
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(horizontal, 16, horizontal, 32),
              children: [
                _UserHeader(user: user, onMessage: () => _message(user)),
                if (user.bio?.isNotEmpty == true) ...[
                  const SizedBox(height: 18),
                  Text('Sobre', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(user.bio!),
                ],
                const SizedBox(height: 22),
                Text('Projetos (${academic.profileProjects.length})',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                if (academic.profileProjects.isEmpty)
                  const AcademicEmptyState(
                    icon: Icons.folder_off_outlined,
                    title: 'Nenhum projeto visível',
                    description:
                        'Os projetos públicos deste perfil aparecerão aqui.',
                  )
                else
                  for (final project in academic.profileProjects) ...[
                    AcademicActionTile(
                      icon: Icons.folder_outlined,
                      title: project.title,
                      description: [project.area, project.course]
                          .where((item) => item.isNotEmpty)
                          .join(' · '),
                      badge: project.status,
                      onTap: () => context.push('/projects/${project.id}'),
                    ),
                    const SizedBox(height: 8),
                  ],
                if (academic.profileDocuments.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Text('Documentos públicos',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 10),
                  for (final document in academic.profileDocuments) ...[
                    _PublicDocumentTile(
                      document: document,
                      onOpen: () => _openDocument(document.url),
                    ),
                    const Divider(height: 1),
                  ],
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PublicDocumentTile extends StatelessWidget {
  const _PublicDocumentTile({
    required this.document,
    required this.onOpen,
  });

  final AcademicDocument document;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final available = document.externalUri != null;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.description_outlined),
      title: Text(document.name),
      subtitle: Text('${document.type} · ${document.status}'),
      trailing: IconButton(
        tooltip: available ? 'Abrir documento' : 'Link indisponível',
        onPressed: available ? onOpen : null,
        icon: const Icon(Icons.open_in_new),
      ),
    );
  }
}

class _UserHeader extends StatelessWidget {
  const _UserHeader({required this.user, required this.onMessage});

  final User user;
  final VoidCallback onMessage;

  @override
  Widget build(BuildContext context) {
    final initials = user.name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            CircleAvatar(
              radius: 40,
              foregroundImage:
                  user.avatarUrl == null ? null : NetworkImage(user.avatarUrl!),
              child: Text(initials.isEmpty ? 'U' : initials),
            ),
            const SizedBox(height: 10),
            Text(user.name, style: Theme.of(context).textTheme.titleLarge),
            Text(
              [user.type, user.course, user.institution]
                  .whereType<String>()
                  .where((item) => item.isNotEmpty)
                  .join(' · '),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
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
