import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/user_role.dart';
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
    final advisor = isAdvisor(context.watch<AuthProvider>().currentUser);
    final title = advisor ? 'Orientacoes' : 'Projetos';
    final description = advisor
        ? 'Acompanhe os projetos vinculados a voce e as pendencias de orientacao.'
        : 'Encontre projetos, filtre por area e acompanhe oportunidades.';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.projects.isEmpty) {
            return LoadingIndicator(
              label: advisor
                  ? 'Carregando orientacoes...'
                  : 'Carregando projetos...',
            );
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
                        Text(
                          description,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 14),
                        AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  labelText: advisor
                                      ? 'Buscar orientacoes'
                                      : 'Buscar projetos',
                                  prefixIcon: const Icon(Icons.search),
                                ),
                                onSubmitted: (_) => _loadProjects(provider),
                              ),
                              const SizedBox(height: 12),
                              ProjectFilterBar(
                                selectedStatus: _selectedStatus,
                                areaController: _areaController,
                                courseController: _courseController,
                                onStatusChanged: (value) {
                                  setState(() => _selectedStatus = value);
                                  _loadProjects(provider);
                                },
                                onApply: () => _loadProjects(provider),
                                onClear: () => _clearFilters(provider),
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
                          SizedBox(
                            height: 280,
                            child: EmptyState(
                              title: advisor
                                  ? 'Nenhuma orientacao encontrada'
                                  : 'Nenhum projeto encontrado',
                              subtitle: advisor
                                  ? 'Quando houver projetos vinculados a voce, eles aparecerao aqui.'
                                  : 'Puxe para atualizar ou ajuste a busca.',
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

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 12.0;
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
                child: child,
              ),
          ],
        );
      },
    );
  }
}
