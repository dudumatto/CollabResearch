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
    expect(find.byType(TextFormField), findsNWidgets(3));

    await tester.enterText(find.byType(TextFormField).at(0), 'Usuario Teste');
    await tester.enterText(find.byType(TextFormField).at(1), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), 'senha1234');

    await tester.tap(find.widgetWithText(AppButton, 'Criar conta'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(auth.registerCalls, 1);
    expect(auth.lastRegisterPayload?['nome'], 'Usuario Teste');
    expect(auth.lastRegisterPayload?['email'], 'usuario@example.com');
    expect(auth.lastRegisterPayload?['senha'], 'senha1234');
    expect(find.byType(TextFormField), findsNWidgets(2));

    await tester.enterText(find.byType(TextFormField).at(0), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'senha1234');

    await tester.tap(find.widgetWithText(AppButton, 'Entrar'));
    await tester.pump(const Duration(milliseconds: 500));

    expect(auth.loginCalls, 1);
    expect(auth.isAuthenticated, isTrue);
    expect(find.text('Dashboard'), findsOneWidget);

    await tester.tap(find.text('Projetos'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Projetos'), findsWidgets);
    expect(find.widgetWithText(AppButton, 'Carregar mais'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'sistema');
    await tester.tap(find.widgetWithText(AppButton, 'Carregar mais'));
    await tester.pump(const Duration(milliseconds: 200));

    await tester.tap(find.text('Chat'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Chat'), findsWidgets);
    expect(find.byType(TextField), findsOneWidget);
    await tester.enterText(find.byType(TextField).at(0), 'orientador');
    expect(find.text('Orientador'), findsOneWidget);

    await tester.tap(find.text('Alertas'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Notificacoes'), findsOneWidget);
    expect(find.widgetWithText(AppButton, 'Marcar todas como lidas'), findsOneWidget);
    await tester.tap(find.widgetWithText(AppButton, 'Marcar todas como lidas'));
    await tester.pump(const Duration(milliseconds: 200));

    await tester.tap(find.text('Perfil'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Perfil'), findsWidgets);
    await tester.tap(find.byIcon(Icons.settings));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Configuracoes'), findsOneWidget);
    final switchTiles = find.byType(SwitchListTile);
    expect(switchTiles, findsNWidgets(2));

    expect(tester.widget<SwitchListTile>(switchTiles.at(0)).value, isTrue);
    await tester.tap(switchTiles.at(0));
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.widget<SwitchListTile>(switchTiles.at(0)).value, isFalse);

    expect(tester.widget<SwitchListTile>(switchTiles.at(1)).value, isFalse);
    await tester.tap(switchTiles.at(1));
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.widget<SwitchListTile>(switchTiles.at(1)).value, isTrue);

    await tester.tap(find.text('Sair'));
    await tester.pump(const Duration(milliseconds: 500));

    expect(auth.logoutCalls, 1);
    expect(auth.isAuthenticated, isFalse);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.widgetWithText(AppButton, 'Entrar'), findsOneWidget);
  });
}
