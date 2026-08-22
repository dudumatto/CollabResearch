import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  static ThemeData get lightTheme {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        onPrimary: AppColors.surface,
        primaryContainer: AppColors.surfaceTint,
        onPrimaryContainer: AppColors.text,
        secondary: AppColors.secondary,
        onSecondary: AppColors.surface,
        tertiary: AppColors.accent,
        surface: AppColors.surface,
        onSurface: AppColors.text,
        error: AppColors.danger,
        outline: AppColors.border,
      ),
      scaffoldBackgroundColor: AppColors.background,
      textTheme: AppTypography.textTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.text,
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
          color: AppColors.text,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.4,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.surfaceTint,
        elevation: 0,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? AppColors.primary
                : AppColors.muted,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11.5,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w800
                : FontWeight.w600,
            color: states.contains(WidgetState.selected)
                ? AppColors.primary
                : AppColors.muted,
          ),
        ),
      ),
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.surfaceTint,
        selectedIconTheme: IconThemeData(color: AppColors.primary),
        unselectedIconTheme: IconThemeData(color: AppColors.muted),
        selectedLabelTextStyle: TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w800,
        ),
        unselectedLabelTextStyle: TextStyle(
          color: AppColors.muted,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: AppColors.surfaceTint,
        selectedColor: AppColors.color1,
        side: const BorderSide(color: AppColors.border),
        labelStyle: const TextStyle(color: AppColors.text),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryDark,
          side: const BorderSide(color: AppColors.border),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          minimumSize: const Size(0, 50),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.surface,
          disabledBackgroundColor: AppColors.color1,
          disabledForegroundColor: AppColors.muted,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          minimumSize: const Size(0, 50),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        focusColor: AppColors.surfaceTint,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.4),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      colorScheme: const ColorScheme.dark(
        primary: AppColors.darkPrimary,
        onPrimary: AppColors.darkBackground,
        primaryContainer: AppColors.darkPrimaryContainer,
        onPrimaryContainer: AppColors.darkText,
        secondary: AppColors.color2,
        onSecondary: AppColors.darkBackground,
        tertiary: AppColors.accent,
        surface: AppColors.darkSurface,
        onSurface: AppColors.darkText,
        error: Color(0xFFFF8A8A),
      ),
      scaffoldBackgroundColor: AppColors.darkBackground,
      textTheme: AppTypography.textTheme(
        base.textTheme,
        textColor: AppColors.darkText,
        mutedColor: AppColors.darkMuted,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        foregroundColor: AppColors.darkText,
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        indicatorColor: AppColors.darkSurfaceTint,
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ),
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: AppColors.darkSurface,
        indicatorColor: AppColors.darkSurfaceTint,
        selectedIconTheme: IconThemeData(color: AppColors.darkPrimary),
        selectedLabelTextStyle: TextStyle(
          color: AppColors.darkPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: AppColors.darkBorder),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: AppColors.darkSurfaceTint,
        selectedColor: AppColors.darkPrimaryContainer,
        side: const BorderSide(color: AppColors.darkBorder),
        labelStyle: const TextStyle(color: AppColors.darkText),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkPrimary,
          side: const BorderSide(color: AppColors.darkBorder),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          minimumSize: const Size(0, 48),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.darkPrimary,
          foregroundColor: AppColors.darkBackground,
          disabledBackgroundColor: AppColors.darkSurfaceTint,
          disabledForegroundColor: AppColors.darkMuted,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          minimumSize: const Size(0, 48),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        focusColor: AppColors.darkSurfaceTint,
        labelStyle: const TextStyle(color: AppColors.darkMuted),
        prefixIconColor: AppColors.darkMuted,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(
            color: AppColors.darkPrimary,
            width: 1.4,
          ),
        ),
      ),
    );
  }
}
