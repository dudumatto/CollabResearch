import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/projects/project_card.dart';
import '../../widgets/projects/project_filter_bar.dart';

class ProjectsListScreen extends StatefulWidget {
  const ProjectsListScreen({super.key});

  @override
  State<ProjectsListScreen> createState() => _ProjectsListScreenState();
}

class _ProjectsListScreenState extends State<ProjectsListScreen> {
  final _searchController = TextEditingController();
  final _areaController = TextEditingController();
  final _courseController = TextEditingController();
  String? _selectedStatus;
  bool _filtersVisible = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().loadProjects();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _areaController.dispose();
    _courseController.dispose();
    super.dispose();
  }

  Future<void> _loadProjects(ProjectProvider provider) {
    return provider.loadProjects(
      search: _searchController.text.trim(),
      status: _selectedStatus,
      area: _areaController.text.trim(),
      course: _courseController.text.trim(),
    );
  }

  void _clearFilters(ProjectProvider provider) {
    setState(() {
      _selectedStatus = null;
      _searchController.clear();
      _areaController.clear();
      _courseController.clear();
    });
    _loadProjects(provider);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    final userType = user?.type?.toUpperCase() ??
        (user?.roles.isNotEmpty == true ? user!.roles.first.toUpperCase() : '');
    final canCreate = userType == 'ALUNO' || userType == 'ORIENTADOR';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 24,
        title: Text(
          'Projetos',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => context.go('/projects/create'),
              icon: const Icon(Icons.add),
              label: const Text('Criar projeto'),
            )
          : null,
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.projects.isEmpty) {
            return const LoadingIndicator(label: 'Carregando projetos...');
          }

          return RefreshIndicator(
            onRefresh: () => _loadProjects(provider),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1180),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextField(
                                controller: _searchController,
                                decoration: const InputDecoration(
                                  labelText: 'Buscar projetos',
                                  prefixIcon: Icon(Icons.search),
                                ),
                                onSubmitted: (_) => _loadProjects(provider),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () => setState(
                                    () => _filtersVisible = !_filtersVisible,
                                  ),
                                  icon: Icon(
                                    _filtersVisible
                                        ? Icons.expand_less
                                        : Icons.tune_rounded,
                                  ),
                                  label: Text(
                                    _filtersVisible
                                        ? 'Ocultar filtros'
                                        : 'Filtros',
                                  ),
                                ),
                              ),
                              AnimatedSize(
                                duration: const Duration(milliseconds: 200),
                                curve: Curves.easeOutCubic,
                                alignment: Alignment.topCenter,
                                child: _filtersVisible
                                    ? Padding(
                                        padding: const EdgeInsets.only(top: 12),
                                        child: ProjectFilterBar(
                                          selectedStatus: _selectedStatus,
                                          areaController: _areaController,
                                          courseController: _courseController,
                                          onStatusChanged: (value) {
                                            setState(
                                                () => _selectedStatus = value);
                                            _loadProjects(provider);
                                          },
                                          onApply: () =>
                                              _loadProjects(provider),
                                          onClear: () =>
                                              _clearFilters(provider),
                                        ),
                                      )
                                    : const SizedBox.shrink(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (provider.errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Text(
                              provider.errorMessage!,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ),
                        if (provider.projects.isEmpty)
                          const SizedBox(
                            height: 280,
                            child: EmptyState(
                              title: 'Nenhum projeto encontrado',
                              subtitle:
                                  'Puxe para atualizar ou ajuste a busca.',
                            ),
                          )
                        else
                          _ProjectsGrid(
                            children: [
                              for (final project in provider.projects)
                                ProjectCard(
                                  project: project,
                                  onTap: () =>
                                      context.go('/projects/${project.id}'),
                                ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ProjectsGrid extends StatelessWidget {
  const _ProjectsGrid({required this.children});

  final List<ProjectCard> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 12.0;
        // Mobile-only: a grade repassa sua largura real para cada card.
        final isMobile = constraints.maxWidth <= 480;
        final columns = constraints.maxWidth >= 980
            ? 3
            : constraints.maxWidth >= 640
                ? 2
                : 1;
        final itemWidth =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final child in children)
              SizedBox(
                width: itemWidth,
                child: ProjectCard(
                  key: child.key,
                  project: child.project,
                  onTap: child.onTap,
                  mobile: isMobile,
                ),
              ),
          ],
        );
      },
    );
  }
}
