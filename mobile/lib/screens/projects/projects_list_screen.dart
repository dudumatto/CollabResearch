import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_bottom_sheet.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_error_state.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/app_search_field.dart';
import '../../widgets/common/app_skeletons.dart';
import '../../widgets/common/empty_state.dart';
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
  Timer? _searchDebounce;
  String? _selectedStatus;
  bool _wideFiltersVisible = false;

  int get _activeFilterCount => [
        _selectedStatus,
        _areaController.text.trim(),
        _courseController.text.trim(),
      ].where((value) => value != null && value.isNotEmpty).length;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().loadProjects();
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _areaController.dispose();
    _courseController.dispose();
    super.dispose();
  }

  Future<void> _loadProjects(ProjectProvider provider) {
    return provider.loadProjects(
      search: _searchController.text,
      status: _selectedStatus,
      area: _areaController.text,
      course: _courseController.text,
    );
  }

  void _onSearchChanged(ProjectProvider provider, String _) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(
      const Duration(milliseconds: 350),
      () {
        if (mounted) _loadProjects(provider);
      },
    );
  }

  Future<void> _selectMode(
    ProjectProvider provider,
    ProjectListMode mode,
  ) async {
    if (provider.listMode == mode) return;
    await provider.setListMode(mode);
  }

  Future<void> _clearFilters(ProjectProvider provider) async {
    setState(() {
      _selectedStatus = null;
      _areaController.clear();
      _courseController.clear();
    });
    await _loadProjects(provider);
  }

  Future<void> _openFilters(ProjectProvider provider) async {
    var draftStatus = _selectedStatus;
    final draftArea = TextEditingController(text: _areaController.text);
    final draftCourse = TextEditingController(text: _courseController.text);
    final result = await AppBottomSheet.show<_ProjectFilters>(
      context,
      title: 'Filtrar projetos',
      child: StatefulBuilder(
        builder: (context, setSheetState) => SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Status', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final entry in const <String?, String>{
                    null: 'Todos',
                    'ABERTO': 'Aberto',
                    'EM_ANDAMENTO': 'Em andamento',
                    'FINALIZADO': 'Finalizado',
                  }.entries)
                    FilterChip(
                      label: Text(entry.value),
                      selected: draftStatus == entry.key,
                      onSelected: (_) =>
                          setSheetState(() => draftStatus = entry.key),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: draftArea,
                decoration: const InputDecoration(
                  labelText: 'Área',
                  prefixIcon: Icon(Icons.category_outlined),
                ),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: draftCourse,
                decoration: const InputDecoration(
                  labelText: 'Curso',
                  prefixIcon: Icon(Icons.school_outlined),
                ),
                textInputAction: TextInputAction.done,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(
                        context,
                        const _ProjectFilters(clear: true),
                      ),
                      child: const Text('Limpar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(
                        context,
                        _ProjectFilters(
                          status: draftStatus,
                          area: draftArea.text,
                          course: draftCourse.text,
                        ),
                      ),
                      child: const Text('Aplicar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    draftArea.dispose();
    draftCourse.dispose();
    if (result == null || !mounted) return;

    if (result.clear) {
      await _clearFilters(provider);
      return;
    }
    setState(() {
      _selectedStatus = result.status;
      _areaController.text = result.area.trim();
      _courseController.text = result.course.trim();
    });
    await _loadProjects(provider);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    final userType = user?.type?.toUpperCase() ??
        (user?.roles.isNotEmpty == true ? user!.roles.first.toUpperCase() : '');
    final canCreate = userType == 'ALUNO' || userType == 'ORIENTADOR';
    final mobile = MediaQuery.sizeOf(context).width < 600;

    return Scaffold(
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/projects/create'),
              icon: const Icon(Icons.add),
              label: const Text('Criar projeto'),
            )
          : null,
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
          if (provider.isListLoading && provider.projects.isEmpty) {
            return const ProjectListSkeleton();
          }
          if (provider.errorMessage != null && provider.projects.isEmpty) {
            return _FullPageError(
              message: provider.errorMessage!,
              onRefresh: () => _loadProjects(provider),
            );
          }
          return mobile ? _mobileBody(provider) : _wideBody(provider);
        },
      ),
    );
  }

  Widget _mobileBody(ProjectProvider provider) {
    return RefreshIndicator(
      onRefresh: () => _loadProjects(provider),
      child: ListView(
        key: const PageStorageKey('mobile-projects-list'),
        padding: EdgeInsets.fromLTRB(
          12,
          MediaQuery.paddingOf(context).top + 10,
          12,
          116,
        ),
        children: [
          const AppPageHeader(
            eyebrow: 'Pesquisa acadêmica',
            title: 'Projetos',
            description: 'Descubra oportunidades e acompanhe seus projetos.',
            compact: true,
          ),
          _ProjectModeSelector(
            selected: provider.listMode,
            onSelected: (mode) => _selectMode(provider, mode),
          ),
          const SizedBox(height: 14),
          AppSearchField(
            controller: _searchController,
            hintText: 'Buscar projetos',
            onChanged: (value) => _onSearchChanged(provider, value),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 46,
            child: OutlinedButton.icon(
              onPressed: () => _openFilters(provider),
              icon: const Icon(Icons.tune_rounded, size: 19),
              label: Text(
                _activeFilterCount == 0
                    ? 'Filtros'
                    : 'Filtros ($_activeFilterCount)',
              ),
            ),
          ),
          if (_activeFilterCount > 0) ...[
            const SizedBox(height: 10),
            _ActiveFilters(
              status: _selectedStatus,
              area: _areaController.text,
              course: _courseController.text,
              onClear: () => _clearFilters(provider),
            ),
          ],
          if (provider.errorMessage != null) ...[
            const SizedBox(height: 12),
            _InlineError(
              message: provider.errorMessage!,
              onRetry: () => _loadProjects(provider),
            ),
          ],
          const SizedBox(height: 16),
          if (provider.projects.isEmpty)
            SizedBox(
              height: 300,
              child: EmptyState(
                title: provider.listMode == ProjectListMode.mine
                    ? 'Você ainda não participa de projetos'
                    : 'Nenhum projeto encontrado',
                subtitle: _activeFilterCount > 0 ||
                        _searchController.text.trim().isNotEmpty
                    ? 'Limpe os filtros ou tente outra busca.'
                    : provider.listMode == ProjectListMode.mine
                        ? 'Projetos criados ou com participação aparecerão aqui.'
                        : 'Puxe para atualizar e tente novamente.',
              ),
            )
          else ...[
            _ProjectsGrid(
              children: [
                for (final project in provider.projects)
                  ProjectCard(
                    project: project,
                    onTap: () => context.push('/projects/${project.id}'),
                  ),
              ],
            ),
            if (!provider.isLastPage) ...[
              const SizedBox(height: 18),
              SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed:
                      provider.canLoadMore ? provider.loadMoreProjects : null,
                  icon: provider.isLoadingMore
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.expand_more_rounded),
                  label: Text(
                    provider.isLoadingMore ? 'Carregando' : 'Carregar mais',
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _wideBody(ProjectProvider provider) {
    return RefreshIndicator(
      onRefresh: () => _loadProjects(provider),
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          16,
          MediaQuery.paddingOf(context).top + 12,
          16,
          24,
        ),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1180),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AppPageHeader(
                    eyebrow: 'Oportunidades',
                    title: 'Projetos de pesquisa',
                    description:
                        'Encontre projetos abertos e acompanhe os seus.',
                  ),
                  AppCard(
                    child: Column(
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
                              () => _wideFiltersVisible = !_wideFiltersVisible,
                            ),
                            icon: Icon(
                              _wideFiltersVisible
                                  ? Icons.expand_less
                                  : Icons.tune_rounded,
                            ),
                            label: Text(
                              _wideFiltersVisible
                                  ? 'Ocultar filtros'
                                  : 'Filtros',
                            ),
                          ),
                        ),
                        if (_wideFiltersVisible) ...[
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
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (provider.projects.isEmpty)
                    const SizedBox(
                      height: 280,
                      child: EmptyState(
                        title: 'Nenhum projeto encontrado',
                        subtitle: 'Puxe para atualizar ou ajuste a busca.',
                      ),
                    )
                  else
                    _ProjectsGrid(
                      children: [
                        for (final project in provider.projects)
                          ProjectCard(
                            project: project,
                            onTap: () =>
                                context.push('/projects/${project.id}'),
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
  }
}

class _ProjectModeSelector extends StatelessWidget {
  const _ProjectModeSelector(
      {required this.selected, required this.onSelected});

  final ProjectListMode selected;
  final ValueChanged<ProjectListMode> onSelected;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          for (final item in const [
            (ProjectListMode.explore, 'Explorar', Icons.explore_outlined),
            (ProjectListMode.mine, 'Meus projetos', Icons.folder_outlined),
          ])
            Expanded(
              child: Semantics(
                selected: selected == item.$1,
                button: true,
                child: Material(
                  color:
                      selected == item.$1 ? colors.surface : Colors.transparent,
                  borderRadius: BorderRadius.circular(11),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(11),
                    onTap: () => onSelected(item.$1),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(item.$3, size: 18),
                          const SizedBox(width: 7),
                          Flexible(
                            child: Text(
                              item.$2,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: selected == item.$1
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                                color: selected == item.$1
                                    ? colors.primary
                                    : colors.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ActiveFilters extends StatelessWidget {
  const _ActiveFilters({
    required this.status,
    required this.area,
    required this.course,
    required this.onClear,
  });

  final String? status;
  final String area;
  final String course;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final labels = <String>[
      if (status != null)
        switch (status) {
          'ABERTO' => 'Aberto',
          'EM_ANDAMENTO' => 'Em andamento',
          'FINALIZADO' => 'Finalizado',
          _ => status!,
        },
      if (area.trim().isNotEmpty) area.trim(),
      if (course.trim().isNotEmpty) course.trim(),
    ];
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (final label in labels) Chip(label: Text(label)),
        TextButton.icon(
          onPressed: onClear,
          icon: const Icon(Icons.close_rounded, size: 17),
          label: const Text('Limpar'),
        ),
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colors.onErrorContainer),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colors.onErrorContainer),
            ),
          ),
          IconButton(
            onPressed: onRetry,
            tooltip: 'Tentar novamente',
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
    );
  }
}

class _FullPageError extends StatelessWidget {
  const _FullPageError({required this.message, required this.onRefresh});

  final String message;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: AppErrorState(message: message, onRetry: onRefresh),
          ),
        ],
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
        final isMobile = constraints.maxWidth < 600;
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

class _ProjectFilters {
  const _ProjectFilters({
    this.status,
    this.area = '',
    this.course = '',
    this.clear = false,
  });

  final String? status;
  final String area;
  final String course;
  final bool clear;
}
