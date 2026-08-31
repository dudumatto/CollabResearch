import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/project.dart';
import '../common/app_card.dart';

/// Uma faixa do grafico: rotulo, quantidade e cor.
class ProjectStatusSlice {
  const ProjectStatusSlice({
    required this.label,
    required this.count,
    required this.color,
  });

  final String label;
  final int count;
  final Color color;
}

/// Agrupa os projetos por situacao.
///
/// Mantem tres categorias nomeadas mais "Outros". Segurar o numero de cores
/// em tres e o que sustenta a separacao validada da paleta; status marginais
/// (aguardando orientador, recusado) entram no grupo neutro em vez de virarem
/// series proprias.
List<ProjectStatusSlice> buildProjectStatusSlices(
  List<Project> projects, {
  required bool isDark,
}) {
  var open = 0;
  var running = 0;
  var done = 0;
  var other = 0;

  for (final project in projects) {
    switch (project.status.trim().toUpperCase()) {
      case 'ABERTO':
        open++;
      case 'EM_ANDAMENTO':
        running++;
      case 'FINALIZADO':
        done++;
      default:
        other++;
    }
  }

  final slices = <ProjectStatusSlice>[
    ProjectStatusSlice(
      label: 'Finalizados',
      count: done,
      color: isDark ? AppColors.darkChartGreen : AppColors.chartGreen,
    ),
    ProjectStatusSlice(
      label: 'Em andamento',
      count: running,
      color: isDark ? AppColors.darkChartAmber : AppColors.chartAmber,
    ),
    ProjectStatusSlice(
      label: 'Abertos',
      count: open,
      color: isDark ? AppColors.darkChartIndigo : AppColors.chartIndigo,
    ),
  ];

  if (other > 0) {
    slices.add(
      ProjectStatusSlice(
        label: 'Outros',
        count: other,
        color: isDark ? AppColors.darkChartNeutral : AppColors.chartNeutral,
      ),
    );
  }

  return slices;
}

/// Distribuicao dos projetos do usuario por situacao.
class ProjectStatusChart extends StatelessWidget {
  const ProjectStatusChart({super.key, required this.projects});

  final List<Project> projects;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final slices = buildProjectStatusSlices(projects, isDark: isDark);
    final total = slices.fold<int>(0, (sum, slice) => sum + slice.count);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Meus projetos', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.xs),
          Text(
            total == 0
                ? 'Nenhum projeto vinculado ainda.'
                : '$total no total, por situação.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (total == 0)
            // Estado vazio de verdade. O grafico anterior desenhava uma barra
            // de 8px para o valor zero, o que parecia dado e nao era.
            _EmptyChart(theme: theme)
          else ...[
            SizedBox(
              height: 168,
              child: _Bars(slices: slices, theme: theme),
            ),
            const SizedBox(height: AppSpacing.lg),
            _Legend(slices: slices, theme: theme),
          ],
        ],
      ),
    );
  }
}

class _Bars extends StatelessWidget {
  const _Bars({required this.slices, required this.theme});

  final List<ProjectStatusSlice> slices;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final maxCount = slices.fold<int>(0, (max, s) => s.count > max ? s.count : max);
    // Folga no topo para o rotulo direto do valor nao encostar na borda.
    final maxY = (maxCount + 1).toDouble();

    return BarChart(
      BarChartData(
        maxY: maxY,
        alignment: BarChartAlignment.spaceAround,
        borderData: FlBorderData(show: false),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 1,
          getDrawingHorizontalLine: (_) => FlLine(
            color: theme.colorScheme.outlineVariant,
            strokeWidth: 1,
          ),
        ),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, _, rod, __) => BarTooltipItem(
              '${slices[group.x].label}\n',
              theme.textTheme.labelSmall!.copyWith(color: Colors.white),
              children: [
                TextSpan(
                  text: '${slices[group.x].count}',
                  style: theme.textTheme.titleSmall!
                      .copyWith(color: Colors.white),
                ),
              ],
            ),
          ),
        ),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
          leftTitles: const AxisTitles(),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 34,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index < 0 || index >= slices.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Text(
                    slices[index].label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    // Texto sempre em cor de texto, nunca na cor da serie.
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        barGroups: [
          for (var index = 0; index < slices.length; index++)
            BarChartGroupData(
              x: index,
              barRods: [
                BarChartRodData(
                  toY: slices[index].count.toDouble(),
                  color: slices[index].color,
                  width: 26,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(4),
                  ),
                ),
              ],
              showingTooltipIndicators: const [],
            ),
        ],
      ),
    );
  }
}

/// Legenda nomeada com a contagem. Garante que a identidade de cada faixa
/// nunca dependa somente da cor.
class _Legend extends StatelessWidget {
  const _Legend({required this.slices, required this.theme});

  final List<ProjectStatusSlice> slices;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.lg,
      runSpacing: AppSpacing.sm,
      children: [
        for (final slice in slices)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: slice.color,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                '${slice.label} · ${slice.count}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class _EmptyChart extends StatelessWidget {
  const _EmptyChart({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        children: [
          Icon(
            Icons.insert_chart_outlined_rounded,
            size: 30,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Sem projetos para exibir',
            style: theme.textTheme.titleSmall,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Participe de um projeto para ver a distribuição.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
