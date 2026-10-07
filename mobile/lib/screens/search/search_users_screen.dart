import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/academic_workspace_provider.dart';
import '../../widgets/common/app_avatar.dart';
import '../../widgets/common/app_search_field.dart';

class SearchUsersScreen extends StatefulWidget {
  const SearchUsersScreen({super.key});

  @override
  State<SearchUsersScreen> createState() => _SearchUsersScreenState();
}

class _SearchUsersScreenState extends State<SearchUsersScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      context.read<AcademicWorkspaceProvider>().searchUsers('');
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) context.read<AcademicWorkspaceProvider>().searchUsers(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AcademicWorkspaceProvider>();
    final results = provider.userSearchResults;
    final isEmpty = _controller.text.trim().isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buscar perfis'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: AppSearchField(
              controller: _controller,
              hintText: 'Buscar por nome...',
              onChanged: _onChanged,
              autofocus: true,
            ),
          ),
        ),
      ),
      body: isEmpty
          ? const Center(
              child: Text('Digite um nome para buscar.'),
            )
          : provider.isLoading && results.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : results.isEmpty
                  ? const Center(child: Text('Nenhum resultado encontrado.'))
                  : ListView.builder(
                      itemCount: results.length,
                      itemBuilder: (context, index) {
                        final user = results[index];
                        return ListTile(
                          leading: AppAvatar(
                            name: user.name,
                            imageUrl: user.avatarUrl,
                            radius: 22,
                          ),
                          title: Text(user.name),
                          subtitle: () {
                            final sub = [user.type, user.course, user.institution]
                                .whereType<String>()
                                .where((s) => s.isNotEmpty)
                                .join(' · ');
                            return sub.isEmpty ? null : Text(sub);
                          }(),
                          onTap: () => context.push('/users/${user.id}'),
                        );
                      },
                    ),
    );
  }
}
