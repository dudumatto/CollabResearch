import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/lumen_recommendation.dart';
import '../../providers/lumen_provider.dart';
import '../../widgets/common/app_badge.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_page_header.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_indicator.dart';

class LumenScreen extends StatefulWidget {
  const LumenScreen({super.key});

  @override
  State<LumenScreen> createState() => _LumenScreenState();
}

class _LumenScreenState extends State<LumenScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LumenProvider>().loadLatest();
    });
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/projects');
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LumenProvider>();
    final items = provider.result.recommendations;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: provider.loadLatest,
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            20,
            MediaQuery.paddingOf(context).top + 16,
            20,
            20,
          ),
          children: [
            AppPageHeader(
              onBack: _goBack,
              eyebrow: 'Lumen AI',
              title: 'Projetos para você',
              description:
                  'A IA compara seu perfil com os projetos abertos e sugere os mais aderentes.',
            ),
            FilledButton.icon(
              onPressed: provider.isLoading ? null : provider.analyze,
              icon: const Icon(Icons.auto_awesome),
              label: Text(
                  items.isEmpty ? 'Analisar meu perfil' : 'Analisar novamente'),
            ),
            const SizedBox(height: 16),
            if (provider.errorMessage != null) ...[
              Text(
                provider.errorMessage!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
              const SizedBox(height: 12),
            ],
            if (provider.isLoading)
              const SizedBox(
                height: 240,
                child: LoadingIndicator(label: 'Lumen está analisando...'),
              )
            else if (items.isEmpty)
              const SizedBox(
                height: 300,
                child: EmptyState(
                  title: 'Nenhuma recomendação',
                  subtitle:
                      'Toque em "Analisar meu perfil" para gerar sugestões.',
                ),
              )
            else ...[
              if (provider.result.notice != null) ...[
                Text(provider.result.notice!,
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 12),
              ],
              for (final item in items) ...[
                _RecommendationCard(
                  item: item,
                  onOpen: () => context.go('/projects/${item.projectId}'),
                ),
                const SizedBox(height: 12),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  const _RecommendationCard({required this.item, required this.onOpen});

  final LumenRecommendation item;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item.title, style: Theme.of(context).textTheme.titleMedium),
          if (item.area.isNotEmpty) ...[
            const SizedBox(height: 8),
            AppBadge(
                label: item.area, color: Theme.of(context).colorScheme.primary),
          ],
          const SizedBox(height: 8),
          Text(item.justification),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onOpen,
            icon: const Icon(Icons.open_in_new),
            label: const Text('Ver projeto'),
          ),
        ],
      ),
    );
  }
}
