import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/dashboard_summary.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/dashboard_provider.dart';
import 'package:tcc_mobile/screens/profile/profile_screen.dart';

class FakeAuthProvider extends AuthProvider {
  FakeAuthProvider() {
    currentUser = const User(
      id: '1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      type: 'ALUNO',
      course: 'Ciencia da Computacao',
    );
    token = 'header.payload.signature';
  }

  int logoutCalls = 0;

  @override
  Future<void> checkAuth() async {}

  @override
  Future<void> logout() async {
    logoutCalls++;
    token = null;
    currentUser = null;
    notifyListeners();
  }
}

Future<FakeAuthProvider> _pumpProfile(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(390, 2400));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final auth = FakeAuthProvider();
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
  return auth;
}

void main() {
  testWidgets('perfil oferece sair da conta', (tester) async {
    await _pumpProfile(tester);
    expect(find.text('Sair da conta'), findsOneWidget);
  });

  testWidgets('sair pede confirmacao antes de encerrar a sessao',
      (tester) async {
    final auth = await _pumpProfile(tester);

    await tester.tap(find.text('Sair da conta'));
    await tester.pumpAndSettle();

    expect(auth.logoutCalls, 0);
    expect(find.widgetWithText(FilledButton, 'Sair'), findsOneWidget);

    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();
    expect(auth.logoutCalls, 0);
  });
}
