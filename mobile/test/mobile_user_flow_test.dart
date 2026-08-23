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
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
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

    expect(find.text('Crie sua conta'), findsOneWidget);
    expect(find.text('Aluno'), findsOneWidget);
    expect(find.text('Orientador'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(6));

    await tester.tap(find.text('Orientador'));
    await tester.pump();
    expect(find.text('Departamento'), findsOneWidget);
    expect(find.text('Titulacao'), findsOneWidget);

    await tester.tap(find.text('Aluno'));
    await tester.pump();

    await tester.enterText(find.byType(TextFormField).at(0), 'Usuario Teste');
    await tester.enterText(
        find.byType(TextFormField).at(1), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), 'senha1234');
    await tester.enterText(find.byType(TextFormField).at(4), 'RA12345');

    await tester.scrollUntilVisible(
      find.byKey(const Key('register-submit')),
      300,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(find.byKey(const Key('register-submit')));
    await tester.pump(const Duration(milliseconds: 300));

    expect(auth.registerCalls, 1);
    expect(auth.lastRegisterPayload?['nome'], 'Usuario Teste');
    expect(auth.lastRegisterPayload?['email'], 'usuario@example.com');
    expect(auth.lastRegisterPayload?['senha'], 'senha1234');
    expect(auth.lastRegisterPayload?['tipo'], 'ALUNO');
    expect(auth.lastRegisterPayload?['ra'], 'RA12345');
    expect(find.byType(TextFormField), findsNWidgets(2));

    await tester.enterText(
        find.byType(TextFormField).at(0), 'usuario@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'senha1234');

    await tester.tap(find.widgetWithText(AppButton, 'Entrar'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    expect(auth.loginCalls, 1);
    expect(auth.isAuthenticated, isTrue);
    expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        0);

    await tester.tap(_navigationLabel('Projetos'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        1);

    await tester.tap(_navigationLabel('Chat'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        2);

    await tester.tap(_navigationLabel('Alertas'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        3);

    await tester.tap(_navigationLabel('Perfil'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        4);
    expect(find.text('Perfil'), findsWidgets);
    final settingsButton = tester.widget<IconButton>(
      find.ancestor(
        of: find.byIcon(Icons.settings),
        matching: find.byType(IconButton),
      ),
    );
    settingsButton.onPressed!();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    expect(find.text('Configuracoes'), findsOneWidget);
    final switchTiles = find.byType(SwitchListTile);
    expect(switchTiles, findsOneWidget);

    expect(tester.widget<SwitchListTile>(switchTiles.at(0)).value, isTrue);
    await tester.tap(switchTiles.at(0));
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.widget<SwitchListTile>(switchTiles.at(0)).value, isFalse);

    expect(find.text('Claro'), findsOneWidget);
    await tester.tap(find.text('Claro'));
    await tester.pump();
    await tester.tap(find.text('Escuro').last);
    await tester.pump();
    expect(find.text('Escuro'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Sair da conta'),
      300,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.drag(
      find.byType(Scrollable).last,
      const Offset(0, -120),
    );
    await tester.pump();
    await tester.tap(find.widgetWithText(ListTile, 'Sair da conta'));
    await tester.pump(const Duration(milliseconds: 500));

    expect(auth.logoutCalls, 1);
    expect(auth.isAuthenticated, isFalse);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.widgetWithText(AppButton, 'Entrar'), findsOneWidget);
  });

  testWidgets('aplica preferencia de tema escuro no app', (tester) async {
    final auth = FakeAuthProvider()
      ..currentUser = const User(
        id: '1',
        name: 'Usuario Teste',
        email: 'usuario@example.com',
        theme: 'escuro',
      );

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthProvider>.value(
        value: auth,
        child: TccMobileApp(authProvider: auth),
      ),
    );

    await tester.pump(const Duration(milliseconds: 300));

    final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(materialApp.themeMode, ThemeMode.dark);
  });
}

Finder _navigationLabel(String label) {
  return find.byWidgetPredicate(
    (widget) => widget is NavigationDestination && widget.label == label,
  );
}
