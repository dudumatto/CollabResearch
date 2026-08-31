import 'package:flutter/animation.dart';

abstract final class AppDurations {
  static const Duration fast = Duration(milliseconds: 180);
  static const Duration medium = Duration(milliseconds: 250);
  static const Duration shimmer = Duration(milliseconds: 1200);
}

abstract final class AppCurves {
  static const Curve standard = Curves.easeInOut;
  static const Curve shimmer = Curves.easeInOutSine;
}
