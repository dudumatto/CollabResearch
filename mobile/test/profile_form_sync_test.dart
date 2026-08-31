import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/dashboard_summary.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/dashboard_provider.dart';
import 'package:tcc_mobile/screens/profile/profile_screen.dart';

/// Usuario magro, como o que sai do JWT logo apos o login: sem instituicao,
/// bio, semestre nem interesses.
const _jwtUser = User(
  id: '1',
  name: 'Ana Souza',
  email: 'ana@example.com',
  type: 'ALUNO',
  course: 'Ciencia da Computacao',
);

/// O mesmo usuario depois que o refreshProfile trouxe os dados completos.
const _fullUser = User(
  id: '1',
  name: 'Ana Souza',
  email: 'ana@example.com',
  type: 'ALUNO',
  course: 'Ciencia da Computacao',
  institution: 'Cotil',
  bio: 'Pesquiso redes neurais.',
  semester: 5,
  interests: 'IA, redes',
);

Future<AuthProvider> _pumpProfile(WidgetTester tester) async {
  // Superficie alta: o ListView so constroi os filhos proximos da viewport, e
  // o card do formulario fica no fim da tela.
  await tester.binding.setSurfaceSize(const Size(390, 2200));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final auth = AuthProvider()..currentUser = _jwtUser;
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

Finder _field(String name) => find.descendant(
      of: find.byKey(ValueKey('profile-field-$name')),
      matching: find.byType(TextFormField),
    );

String _fieldText(WidgetTester tester, String name) {
  return tester.widget<TextFormField>(_field(name)).controller?.text ?? '';
}

void main() {
  testWidgets('perfil enriquecido depois do JWT chega aos campos do formulario',
      (tester) async {
    final auth = await _pumpProfile(tester);

    // Estado inicial: o JWT nao traz instituicao.
    expect(_fieldText(tester, 'instituicao'), isEmpty);

    // refreshProfile devolve o perfil completo para o MESMO usuario.
    auth.currentUser = _fullUser;
    auth.notifyListeners();
    await tester.pump();

    expect(_fieldText(tester, 'instituicao'), 'Cotil');
    expect(_fieldText(tester, 'biografia'), 'Pesquiso redes neurais.');
    expect(_fieldText(tester, 'semestre'), '5');
  });

  testWidgets('atualizacao do perfil nao apaga o que esta sendo digitado',
      (tester) async {
    final auth = await _pumpProfile(tester);

    await tester.tap(find.text('Editar'));
    await tester.pump();

    await tester.enterText(_field('instituicao'), 'Digitando ainda');
    await tester.pump();

    // Um refreshProfile concluido no meio da edicao nao pode sobrescrever.
    auth.currentUser = _fullUser;
    auth.notifyListeners();
    await tester.pump();

    expect(_fieldText(tester, 'instituicao'), 'Digitando ainda');
  });
}
