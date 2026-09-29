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
      displayLarge: GoogleFonts.nunito(
        textStyle: base.displayLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.08,
      ),
      displayMedium: GoogleFonts.nunito(
        textStyle: base.displayMedium,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.1,
      ),
      displaySmall: GoogleFonts.nunito(
        textStyle: base.displaySmall,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.12,
      ),
      headlineLarge: GoogleFonts.nunito(
        textStyle: base.headlineLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.18,
      ),
      headlineMedium: GoogleFonts.nunito(
        textStyle: base.headlineMedium,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.2,
      ),
      headlineSmall: GoogleFonts.nunito(
        textStyle: base.headlineSmall,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.22,
      ),
      titleLarge: GoogleFonts.nunito(
        textStyle: base.titleLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.25,
      ),
      titleMedium: GoogleFonts.nunito(
        textStyle: base.titleMedium,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      titleSmall: GoogleFonts.nunito(
        textStyle: base.titleSmall,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      bodyLarge: GoogleFonts.nunito(
        textStyle: base.bodyLarge,
        color: textColor,
        fontWeight: FontWeight.w400,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.nunito(
        textStyle: base.bodyMedium,
        color: textColor,
        fontWeight: FontWeight.w400,
        height: 1.48,
      ),
      bodySmall: GoogleFonts.nunito(
        textStyle: base.bodySmall,
        color: mutedColor,
        fontWeight: FontWeight.w400,
        height: 1.45,
      ),
      labelLarge: GoogleFonts.nunito(
        textStyle: base.labelLarge,
        color: textColor,
        fontWeight: FontWeight.w700,
        height: 1.25,
      ),
      labelMedium: GoogleFonts.nunito(
        textStyle: base.labelMedium,
        color: textColor,
        fontWeight: FontWeight.w600,
        height: 1.25,
      ),
      labelSmall: GoogleFonts.nunito(
        textStyle: base.labelSmall,
        color: mutedColor,
        fontWeight: FontWeight.w500,
        height: 1.25,
      ),
    );
  }
}
