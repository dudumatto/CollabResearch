import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTypography {
  static TextTheme textTheme(
    TextTheme base, {
    Color textColor = AppColors.text,
    Color mutedColor = AppColors.muted,
  }) {
    final body = GoogleFonts.interTextTheme(base).apply(
      bodyColor: textColor,
      displayColor: textColor,
    );
    return body.copyWith(
      displayLarge: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.4,
      ),
      headlineLarge: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.8,
      ),
      headlineMedium: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
      ),
      headlineSmall: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      titleLarge: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: GoogleFonts.poppins(
        color: textColor,
        fontWeight: FontWeight.w700,
      ),
      titleSmall: GoogleFonts.inter(
        color: textColor,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: GoogleFonts.inter(color: textColor, height: 1.45),
      bodyMedium: GoogleFonts.inter(color: textColor, height: 1.45),
      bodySmall: GoogleFonts.inter(color: mutedColor, height: 1.4),
      labelLarge: GoogleFonts.inter(
        color: textColor,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      ),
      labelMedium: GoogleFonts.inter(
        color: textColor,
        fontWeight: FontWeight.w600,
      ),
      labelSmall: GoogleFonts.inter(
        color: mutedColor,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
