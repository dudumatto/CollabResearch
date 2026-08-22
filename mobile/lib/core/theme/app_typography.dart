import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTypography {
  static TextTheme textTheme(
    TextTheme base, {
    Color textColor = AppColors.text,
    Color mutedColor = AppColors.muted,
  }) {
    return GoogleFonts.interTextTheme(base).copyWith(
      bodyMedium: GoogleFonts.inter(color: textColor),
      bodySmall: GoogleFonts.inter(color: mutedColor),
    );
  }
}
