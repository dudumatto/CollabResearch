import 'package:flutter/material.dart';

class AppColors {
  // Tokens oficiais da versao web e dos SVGs da marca.
  static const Color color1 = Color(0xFFE0E7D2);
  static const Color color2 = Color(0xFF7EA06A);
  static const Color color3 = Color(0xFF557C55);
  static const Color color4 = Color(0xFF1F7A5A);
  static const Color color5 = Colors.white;

  static const Color primary = color4;
  static const Color primary50 = Color(0xFFEFF7F3);
  static const Color primary100 = Color(0xFFD9EDE4);
  static const Color primary200 = Color(0xFFB5DCC9);
  static const Color primary600 = Color(0xFF1B6B4F);
  static const Color primary700 = Color(0xFF185E46);
  static const Color primaryDark = Color(0xFF185E46);
  static const Color secondary = color3;
  static const Color accent = Color(0xFF0B9188);
  static const Color highlight = Color(0xFFBDF3DD);
  static const Color background = Color(0xFFF6F8F5);
  static const Color surface = Colors.white;
  static const Color surfaceTint = Color(0xFFEFF5EC);
  static const Color surfaceStrong = Color(0xFFE0E7D2);
  static const Color text = Color(0xFF17251D);
  static const Color textStrong = Color(0xFF24382B);
  static const Color textMedium = Color(0xFF4D5F53);
  static const Color muted = Color(0xFF66736A);
  static const Color mutedSoft = Color(0xFF8A978D);
  static const Color success = Color(0xFF2E8B57);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
  static const Color border = Color(0xFFDDE5DA);

  // Superficies de container. Sem estas, o ColorScheme cai no padrao do
  // Material 3, que e lilas (#F7F2FA) e destoa do verde da marca.
  static const Color surfaceContainerLow = Color(0xFFF3F7F2);
  static const Color surfaceContainer = Color(0xFFEDF3EC);
  static const Color surfaceContainerHigh = Color(0xFFE6EEE5);

  // Degraus de grafico. O verde da marca tem croma baixo demais para marca
  // fina de grafico (e lido como cinza), entao charts usam chartGreen.
  // Paleta validada em conjunto: separacao ΔE 27 (deuteranopia) e 32
  // (visao normal). Nao acrescentar teal aqui: reprova por croma.
  static const Color chartGreen = Color(0xFF15925C);
  static const Color chartIndigo = Color(0xFF4F46E5);
  static const Color chartAmber = Color(0xFFD97706);
  static const Color chartNeutral = Color(0xFF8A978D);

  static const Color darkPrimary = Color(0xFF7CCFA6);
  static const Color darkPrimaryContainer = Color(0xFF24382B);
  static const Color darkBackground = Color(0xFF101A14);
  static const Color darkSurface = Color(0xFF17251D);
  static const Color darkSurfaceTint = Color(0xFF24382B);
  static const Color darkText = Color(0xFFF6F8F5);
  static const Color darkMuted = Color(0xFFC4D0BE);
  static const Color darkBorder = Color(0xFF35493C);
  static const Color darkDanger = Color(0xFFFF8A80);
  static const Color darkWarning = Color(0xFFFFB74D);
  static const Color darkAccent = Color(0xFF5DD6CF);

  static const Color darkSurfaceContainerLow = Color(0xFF1C2C23);
  static const Color darkSurfaceContainer = Color(0xFF203228);
  static const Color darkSurfaceContainerHigh = Color(0xFF27392E);

  // Degraus proprios para o tema escuro, nao a inversao dos claros: sobre a
  // superficie escura o indigo #4F46E5 fica com contraste 2.77. Este trio
  // passa nos cinco checks; a separacao em tritanopia (6.2) fica na faixa
  // minima, valida porque o grafico traz rotulo direto e legenda nomeada.
  static const Color darkChartGreen = Color(0xFF2AA271);
  static const Color darkChartIndigo = Color(0xFF7D88F2);
  static const Color darkChartAmber = Color(0xFFC48016);
  static const Color darkChartNeutral = Color(0xFFA3B0A7);
}
