import 'package:flutter/material.dart';

abstract final class AppSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;

  static const EdgeInsets page = EdgeInsets.fromLTRB(md, sm, md, xl);
}

abstract final class AppRadius {
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double full = 999;
}

abstract final class AppElevation {
  static const List<BoxShadow> floating = [
    BoxShadow(
      color: Color(0x1017251D),
      blurRadius: 16,
      offset: Offset(0, 5),
    ),
  ];
}
