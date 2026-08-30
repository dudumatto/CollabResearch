import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/screens/landing/landing_screen.dart';

void main() {
  for (final width in <double>[320, 360, 375, 390, 412, 430]) {
    testWidgets('apresentacao nao transborda em $width px', (tester) async {
      await tester.binding.setSurfaceSize(Size(width, 820));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const LandingScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 500));

      expect(tester.takeException(), isNull);
      expect(find.text('Começar agora'), findsOneWidget);
      expect(find.text('Já tenho conta — Entrar'), findsOneWidget);
    });
  }
}
