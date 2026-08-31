import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

abstract final class AppTypography {
  static TextTheme textTheme(
    TextTheme base, {
    Color textColor = AppColors.text,
    Color mutedColor = AppColors.muted,
  }) {
    return TextTheme(
      displayLarge: GoogleFonts.poppins(
        textStyle: base.displayLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.08,
      ),
      displayMedium: GoogleFonts.poppins(
        textStyle: base.displayMedium,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.1,
      ),
      displaySmall: GoogleFonts.poppins(
        textStyle: base.displaySmall,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.12,
      ),
      headlineLarge: GoogleFonts.poppins(
        textStyle: base.headlineLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.18,
      ),
      headlineMedium: GoogleFonts.poppins(
        textStyle: base.headlineMedium,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.2,
      ),
      headlineSmall: GoogleFonts.poppins(
        textStyle: base.headlineSmall,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.22,
      ),
      titleLarge: GoogleFonts.poppins(
        textStyle: base.titleLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.25,
      ),
      titleMedium: GoogleFonts.inter(
        textStyle: base.titleMedium,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      titleSmall: GoogleFonts.inter(
        textStyle: base.titleSmall,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      bodyLarge: GoogleFonts.inter(
        textStyle: base.bodyLarge,
        color: textColor,
        fontWeight: FontWeight.w400,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.inter(
        textStyle: base.bodyMedium,
        color: textColor,
        fontWeight: FontWeight.w400,
        height: 1.48,
      ),
      bodySmall: GoogleFonts.inter(
        textStyle: base.bodySmall,
        color: mutedColor,
        fontWeight: FontWeight.w400,
        height: 1.45,
      ),
      labelLarge: GoogleFonts.inter(
        textStyle: base.labelLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.25,
      ),
      labelMedium: GoogleFonts.inter(
        textStyle: base.labelMedium,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.25,
      ),
      labelSmall: GoogleFonts.inter(
        textStyle: base.labelSmall,
        color: mutedColor,
        fontWeight: FontWeight.w500,
        height: 1.25,
      ),
    );
  }
}
