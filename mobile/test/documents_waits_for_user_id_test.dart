import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/academic_workspace_provider.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/screens/documents/documents_screen.dart';
import 'package:tcc_mobile/widgets/academic/academic_widgets.dart';

class _RecordingWorkspaceProvider extends AcademicWorkspaceProvider {
  final List<String> loadedFor = <String>[];

  @override
  Future<void> loadDocuments(String userId) async {
    loadedFor.add(userId);
    notifyListeners();
  }
}

class _StubAuthProvider extends AuthProvider {
  @override
  Future<void> checkAuth() async {}

  void setUser(User? value) {
    currentUser = value;
    notifyListeners();
  }
}

void main() {
  testWidgets('documentos espera o id e carrega quando ele chega',
      (tester) async {
    final auth = _StubAuthProvider();
    final workspace = _RecordingWorkspaceProvider();

    // Estado logo apos o login: /usuarios/me ainda nao respondeu, entao o
    // usuario existe mas sem id.
    auth.setUser(const User(id: '', name: '', email: 'aluno@universidade.br'));

    final router = GoRouter(
      routes: [GoRoute(path: '/', builder: (_, __) => const DocumentsScreen())],
    );

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: auth),
          ChangeNotifierProvider<AcademicWorkspaceProvider>.value(
              value: workspace),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();

    // Sem id nao ha o que buscar -- e a tela nao pode afirmar que nao ha
    // documentos, que era o que acontecia: o load saia calado e ela ficava
    // presa no estado vazio, sem indicador e sem nova tentativa.
    expect(workspace.loadedFor, isEmpty);
    expect(find.text('Nenhum documento registrado'), findsNothing);
    expect(find.byType(AcademicSkeletonList), findsOneWidget);

    // refreshProfile() responde e traz o id real.
    auth.setUser(
      const User(id: '42', name: 'Aluno', email: 'aluno@universidade.br'),
    );
    await tester.pumpAndSettle();

    expect(workspace.loadedFor, ['42']);
  });

  testWidgets('documentos nao recarrega a cada notificacao do auth',
      (tester) async {
    final auth = _StubAuthProvider();
    final workspace = _RecordingWorkspaceProvider();
    auth.setUser(const User(id: '42', name: 'Aluno', email: 'a@b.br'));

    final router = GoRouter(
      routes: [GoRoute(path: '/', builder: (_, __) => const DocumentsScreen())],
    );

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: auth),
          ChangeNotifierProvider<AcademicWorkspaceProvider>.value(
              value: workspace),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // Uma atualizacao de perfil que nao muda o id nao pode refazer a busca.
    auth.setUser(
      const User(id: '42', name: 'Aluno Renomeado', email: 'a@b.br'),
    );
    await tester.pumpAndSettle();

    expect(workspace.loadedFor, ['42']);
  });
}
