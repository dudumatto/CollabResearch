import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/animation/app_animations.dart';
import '../../core/theme/app_spacing.dart';

class AppResponsiveGrid extends StatelessWidget {
  const AppResponsiveGrid({
    super.key,
    required this.children,
    this.minItemWidth = 220,
    this.maxColumns = 4,
    this.spacing = AppSpacing.lg,
    this.childAspectRatio = 1,
    this.shrinkWrap = true,
    this.physics = const NeverScrollableScrollPhysics(),
  });

  final List<Widget> children;
  final double minItemWidth;
  final int maxColumns;
  final double spacing;
  final double childAspectRatio;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final calculated =
            ((availableWidth + spacing) / (math.max(minItemWidth, 1) + spacing))
                .floor();
        final columns = calculated.clamp(1, math.max(maxColumns, 1)).toInt();

        return GridView.builder(
          shrinkWrap: shrinkWrap,
          physics: physics,
          itemCount: children.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: spacing,
            mainAxisSpacing: spacing,
            childAspectRatio: childAspectRatio,
          ),
          itemBuilder: (context, index) => StaggeredFadeSlideIn(
            index: index,
            child: children[index],
          ),
        );
      },
    );
  }
}
