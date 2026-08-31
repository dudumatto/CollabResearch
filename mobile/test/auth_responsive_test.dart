import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/theme/app_theme.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/screens/auth/login_screen.dart';
import 'package:tcc_mobile/screens/auth/register_screen.dart';

Widget _wrap(Widget child) {
  return ChangeNotifierProvider<AuthProvider>(
    create: (_) => AuthProvider(),
    child: MaterialApp(theme: AppTheme.lightTheme, home: child),
  );
}

void main() {
  // 320x568 cobre o pior caso real: tela curta e estreita, onde o titulo do
  // cabecalho quebra em duas linhas e o conteudo passa da altura da viewport.
  for (final size in const <Size>[
    Size(320, 568),
    Size(320, 700),
    Size(360, 640),
    Size(375, 812),
    Size(390, 844),
    Size(412, 892),
    Size(430, 932),
  ]) {
    testWidgets(
      'login nao transborda em ${size.width.toInt()}x${size.height.toInt()}',
      (tester) async {
        await tester.binding.setSurfaceSize(size);
        addTearDown(() => tester.binding.setSurfaceSize(null));

        await tester.pumpWidget(_wrap(const LoginScreen()));
        await tester.pump(const Duration(milliseconds: 500));

        expect(tester.takeException(), isNull);
        expect(find.text('Bem-vindo de volta'), findsOneWidget);
        expect(find.text('Email'), findsOneWidget);
        expect(find.text('Senha'), findsOneWidget);
      },
    );

    testWidgets(
      'cadastro nao transborda em ${size.width.toInt()}x${size.height.toInt()}',
      (tester) async {
        await tester.binding.setSurfaceSize(size);
        addTearDown(() => tester.binding.setSurfaceSize(null));

        await tester.pumpWidget(_wrap(const RegisterScreen()));
        await tester.pump(const Duration(milliseconds: 500));

        expect(tester.takeException(), isNull);
        expect(find.text('Crie sua conta'), findsOneWidget);
        expect(find.text('Qual é o seu perfil?'), findsOneWidget);
      },
    );
  }

  testWidgets('login nao transborda com fonte ampliada em 320 px',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(320, 640),
          textScaler: TextScaler.linear(1.4),
        ),
        child: _wrap(const LoginScreen()),
      ),
    );
    await tester.pump(const Duration(milliseconds: 500));

    expect(tester.takeException(), isNull);
  });
}
