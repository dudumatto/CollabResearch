import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'app_durations.dart';

class FadeSlideIn extends StatefulWidget {
  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.beginOffset = const Offset(0, 0.045),
  });

  final Widget child;
  final int index;
  final Offset beginOffset;

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppDurations.normal,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.value = 1;
      _started = false;
      return;
    }
    if (!_started) {
      _started = true;
      _controller.value = 0;
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return widget.child;

    final start = math.min(math.max(widget.index, 0) * 0.055, 0.38);
    final animation = CurvedAnimation(
      parent: _controller,
      curve: Interval(start, 1, curve: AppCurves.enter),
    );
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: widget.beginOffset,
          end: Offset.zero,
        ).animate(animation),
        child: widget.child,
      ),
    );
  }
}

class StaggeredFadeSlideIn extends StatelessWidget {
  const StaggeredFadeSlideIn({
    super.key,
    required this.index,
    required this.child,
  });

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return FadeSlideIn(index: index, child: child);
  }
}

class AnimatedPress extends StatefulWidget {
  const AnimatedPress({
    super.key,
    required this.child,
    this.enabled = true,
    this.pressedScale = 0.985,
  });

  final Widget child;
  final bool enabled;
  final double pressedScale;

  @override
  State<AnimatedPress> createState() => _AnimatedPressState();
}

class _AnimatedPressState extends State<AnimatedPress> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (!widget.enabled || _pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled || MediaQuery.disableAnimationsOf(context)) {
      return widget.child;
    }

    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1,
        duration: AppDurations.press,
        curve: AppCurves.press,
        child: widget.child,
      ),
    );
  }
}
