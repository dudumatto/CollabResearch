import 'package:flutter/animation.dart';

abstract final class AppDurations {
  static const Duration instant = Duration.zero;
  static const Duration press = Duration(milliseconds: 100);
  static const Duration fast = Duration(milliseconds: 180);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration medium = Duration(milliseconds: 250);
  static const Duration shimmer = Duration(milliseconds: 360);
}

abstract final class AppCurves {
  static const Curve standard = Curves.easeInOut;
  static const Curve enter = Curves.easeOutCubic;
  static const Curve exit = Curves.easeInCubic;
  static const Curve press = Curves.easeOut;
  static const Curve shimmer = Curves.easeInOutSine;
}
