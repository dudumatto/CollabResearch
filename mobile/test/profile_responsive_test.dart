import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/dashboard_summary.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/dashboard_provider.dart';
import 'package:tcc_mobile/screens/profile/profile_screen.dart';

void main() {
  // Acima de 480 px o ramo desktop usava Row(spaceEvenly) com _ProfileStat sem
  // constraint, maxLines: null e TextOverflow.clip: um curso longo transbordava.
  for (final width in [481.0, 600.0, 900.0]) {
    testWidgets('perfil nao transborda em ${width.toInt()} px com curso longo',
        (tester) async {
      await tester.binding.setSurfaceSize(Size(width, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final auth = AuthProvider()
        ..currentUser = const User(
          id: '1',
          name: 'Maria Fernanda de Oliveira Albuquerque',
          email: 'maria@example.com',
          institution: 'Centro Universitario de Tecnologia de Campinas',
          type: 'ALUNO',
          course: 'Engenharia de Computacao e Sistemas Distribuidos',
          semester: 8,
        );
      final dashboard = DashboardProvider()
        ..summary = const DashboardSummary(myProjects: 12);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>.value(value: auth),
            ChangeNotifierProvider<DashboardProvider>.value(value: dashboard),
          ],
          child: const MaterialApp(home: ProfileScreen()),
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
    });
  }

  for (final width in [320.0, 329.0, 360.0, 390.0, 480.0]) {
    testWidgets(
        'perfil nao apresenta overflow horizontal em ${width.toInt()} px',
        (tester) async {
      // Mobile-only regression: cobre os limites e a largura da captura enviada.
      await tester.binding.setSurfaceSize(Size(width, 747));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final auth = AuthProvider()
        ..currentUser = const User(
          id: '1',
          name: 'teste',
          email: 'teste@example.com',
          institution: 'cotil',
          type: 'ALUNO',
          course: 'Ciencia da Computacao',
        );
      final dashboard = DashboardProvider()
        ..summary = const DashboardSummary(myProjects: 2);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>.value(value: auth),
            ChangeNotifierProvider<DashboardProvider>.value(value: dashboard),
          ],
          child: const MaterialApp(home: ProfileScreen()),
        ),
      );
      await tester.pump();

      expect(tester.getSize(find.byType(Scaffold)).width, width);
      expect(find.byKey(const Key('profile-mobile-stats')), findsOneWidget);
      expect(tester.takeException(), isNull);
      expect(find.text('Ciencia da Computacao'), findsOneWidget);
    });
  }
}
