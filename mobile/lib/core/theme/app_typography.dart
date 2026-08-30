import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTypography {
  static TextTheme textTheme(
    TextTheme base, {
    Color textColor = AppColors.text,
    Color mutedColor = AppColors.muted,
  }) {
    final body = GoogleFonts.manropeTextTheme(base).apply(
      bodyColor: textColor,
      displayColor: textColor,
    );
    return body.copyWith(
      displayLarge: GoogleFonts.outfit(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.4,
      ),
      headlineLarge: GoogleFonts.outfit(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.8,
      ),
      headlineMedium: GoogleFonts.outfit(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
      ),
      headlineSmall: GoogleFonts.outfit(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      titleLarge: GoogleFonts.outfit(
        color: textColor,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: GoogleFonts.manrope(
        color: textColor,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: GoogleFonts.manrope(color: textColor, height: 1.45),
      bodyMedium: GoogleFonts.manrope(color: textColor, height: 1.45),
      bodySmall: GoogleFonts.manrope(color: mutedColor, height: 1.4),
      labelLarge: GoogleFonts.manrope(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      ),
    );
  }
}
