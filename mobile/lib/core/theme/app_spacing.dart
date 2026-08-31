import 'package:flutter/material.dart';

abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  // Aliases mantidos para compatibilidade com os consumidores atuais.
  static const double xxs = xs;
  static const EdgeInsets page = EdgeInsets.fromLTRB(lg, md, lg, xl);
}

abstract final class AppRadius {
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 20;
  static const double pill = 999;

  // Alias legado usado pela landing page.
  static const double full = pill;
}

abstract final class AppBreakpoints {
  static const double compact = 600;
  static const double medium = 760;
  static const double expanded = 1024;
}

abstract final class AppShadows {
  static const List<BoxShadow> lightLow = [
    BoxShadow(
      color: Color(0x0D17251D),
      blurRadius: 10,
      offset: Offset(0, 3),
    ),
  ];

  static const List<BoxShadow> lightMedium = [
    BoxShadow(
      color: Color(0x1417251D),
      blurRadius: 18,
      offset: Offset(0, 6),
    ),
  ];

  static const List<BoxShadow> darkLow = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> darkMedium = [
    BoxShadow(
      color: Color(0x47000000),
      blurRadius: 20,
      offset: Offset(0, 7),
    ),
  ];
}
