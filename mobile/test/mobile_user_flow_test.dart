import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/app.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/widgets/common/app_button.dart';

class FakeAuthProvider extends AuthProvider {
  int loginCalls = 0;
  int registerCalls = 0;
  int logoutCalls = 0;
  Map<String, dynamic>? lastRegisterPayload;

  @override
  Future<void> checkAuth() async {
    token = null;
    currentUser = null;
    pendingRedirectLocation = null;
    notifyListeners();
  }

  @override
  Future<void> login(String email, String password) async {
    loginCalls++;
    token = 'header.payload.signature';
    currentUser = User(
      id: '1',
      name: 'Usuario Teste',
      email: email,
      type: 'ALUNO',
    );
    pendingRedirectLocation = null;
    notifyListeners();
  }

  @override
  Future<void> register(Map<String, dynamic> data) async {
    registerCalls++;
    lastRegisterPayload = Map<String, dynamic>.from(data);
    notifyListeners();
  }

  @override
  Future<void> logout() async {
    logoutCalls++;
    token = null;
    currentUser = null;
    pendingRedirectLocation = null;
    notifyListeners();
  }
}

void main() {
  testWidgets('fluxo principal do usuario no mobile', (tester) async {
    final auth = FakeAuthProvider();

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthProvider>.value(
        value: auth,
        child: TccMobileApp(authProvider: auth),
      ),
    );

    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('CollabResearch'), findsOneWidget);

    await tester.tap(find.widgetWithText(AppButton, 'Criar conta'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Cadastro'), findsOneWidget);
    expect(find.text('Aluno'), findsOneWidget);
    expect(find.text('Orientador'), findsOneWidget);

    await tester.tap(find.widgetWithText(AppButton, 'Continuar'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.byType(TextFormField), findsNWidgets(5));
    await tester.enterText(find.byType(TextFormField).at(0), 'Usuario Teste');
    await tester.enterText(
        find.byType(TextFormField).at(1), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), '123456');
    await tester.enterText(find.byType(TextFormField).at(3), 'senha1234');
    await tester.enterText(find.byType(TextFormField).at(4), 'senha1234');

    await tester.ensureVisible(find.widgetWithText(AppButton, 'Continuar'));
    await tester.tap(find.widgetWithText(AppButton, 'Continuar'));
    await tester.pump(const Duration(milliseconds: 300));

    await tester
        .ensureVisible(find.byType(DropdownButtonFormField<String>).first);
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Outra').last);
    await tester.pump(const Duration(milliseconds: 300));

    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump(const Duration(milliseconds: 200));

    await tester.ensureVisible(find.widgetWithText(AppButton, 'Criar conta'));
    await tester.tap(find.widgetWithText(AppButton, 'Criar conta'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(auth.registerCalls, 1);
    expect(auth.lastRegisterPayload?['nome'], 'Usuario Teste');
    expect(auth.lastRegisterPayload?['email'], 'usuario@example.com');
    expect(auth.lastRegisterPayload?['senha'], 'senha1234');
    expect(auth.lastRegisterPayload?['tipo'], 'ALUNO');
    expect(auth.lastRegisterPayload?['ra'], '123456');
    expect(auth.lastRegisterPayload?['instituicao'], 'Outra');
    expect(find.byType(TextFormField), findsNWidgets(2));

    await tester.enterText(
        find.byType(TextFormField).at(0), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'senha1234');

    await tester.tap(find.widgetWithText(AppButton, 'Entrar'));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    expect(auth.loginCalls, 1);
    expect(auth.isAuthenticated, isTrue);
    expect(find.text('Painel do aluno'), findsOneWidget);
  });
}
