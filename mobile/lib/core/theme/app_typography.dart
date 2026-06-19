import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTypography {
  static TextTheme textTheme(TextTheme base) {
    return GoogleFonts.interTextTheme(base).copyWith(
      bodyMedium: GoogleFonts.inter(color: AppColors.text),
      bodySmall: GoogleFonts.inter(color: AppColors.muted),
    );
  }
}
