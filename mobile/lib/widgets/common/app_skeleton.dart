import 'package:flutter/material.dart';

import '../../core/animation/app_durations.dart';
import '../../core/theme/app_spacing.dart';

class AppSkeleton extends StatefulWidget {
  const AppSkeleton({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = AppRadius.sm,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppDurations.shimmer,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final animationsDisabled = MediaQuery.disableAnimationsOf(context);
    final baseColor = scheme.surfaceContainerHighest;
    final highlightColor = Color.lerp(baseColor, scheme.surface, 0.72)!;

    Widget block({Gradient? gradient}) => Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: gradient == null ? baseColor : null,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: gradient,
          ),
        );

    return Semantics(
      label: 'Carregando conteúdo',
      container: true,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          if (animationsDisabled) return block();
          final progress = AppCurves.shimmer.transform(_controller.value);
          final position = (progress * 2) - 1;
          return block(
            gradient: LinearGradient(
              begin: Alignment(position - 1, 0),
              end: Alignment(position + 1, 0),
              colors: [baseColor, highlightColor, baseColor],
              stops: const [0.2, 0.5, 0.8],
            ),
          );
        },
      ),
    );
  }
}

class AppSkeletonText extends StatelessWidget {
  const AppSkeletonText({
    super.key,
    this.lines = 3,
    this.lineHeight = 14,
    this.spacing = AppSpacing.sm,
  });

  final int lines;
  final double lineHeight;
  final double spacing;

  static const _widthFactors = <double>[1, 0.88, 0.94, 0.72];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var index = 0; index < lines; index++) ...[
          FractionallySizedBox(
            widthFactor: index == lines - 1
                ? 0.62
                : _widthFactors[index % _widthFactors.length],
            child: AppSkeleton(height: lineHeight),
          ),
          if (index < lines - 1) SizedBox(height: spacing),
        ],
      ],
    );
  }
}

class AppSkeletonCircle extends StatelessWidget {
  const AppSkeletonCircle({super.key, this.size = 48});

  final double size;

  @override
  Widget build(BuildContext context) {
    return AppSkeleton(width: size, height: size, borderRadius: size / 2);
  }
}
