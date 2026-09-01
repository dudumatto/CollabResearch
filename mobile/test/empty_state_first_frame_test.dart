import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/research_activity_provider.dart';
import 'package:tcc_mobile/screens/feedback/feedback_screen.dart';
import 'package:tcc_mobile/screens/progress/progress_screen.dart';
import 'package:tcc_mobile/widgets/common/empty_state.dart';
import 'package:tcc_mobile/widgets/common/loading_indicator.dart';

/// Segura o carregamento aberto para observar o intervalo entre a montagem da
/// tela e a resposta do backend -- que e onde o estado vazio piscava.
class _PendingActivityProvider extends ResearchActivityProvider {
  final Completer<void> gate = Completer<void>();

  @override
  Future<void> loadRelatedProjects() async {
    isLoading = true;
    notifyListeners();
    await gate.future;
    isLoading = false;
    notifyListeners();
  }

  @override
  Future<void> loadFeedback(String projectId) async {}

  @override
  Future<void> loadProgress(String projectId) async {}
}

class _StubAuthProvider extends AuthProvider {
  @override
  Future<void> checkAuth() async {}
}

Future<_PendingActivityProvider> _pumpScreen(
  WidgetTester tester,
  Widget screen,
) async {
  final activity = _PendingActivityProvider();
  final router = GoRouter(
    routes: [GoRoute(path: '/', builder: (_, __) => screen)],
  );

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => _StubAuthProvider()),
        ChangeNotifierProvider<ResearchActivityProvider>.value(value: activity),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  return activity;
}

/// Solta o carregamento e deixa a arvore assentar, para o teste nao terminar
/// com trabalho pendente.
Future<void> _settle(WidgetTester tester, _PendingActivityProvider a) async {
  a.gate.complete();
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('feedback nao diz "nenhum projeto" antes de carregar',
      (tester) async {
    final activity = await _pumpScreen(tester, const FeedbackScreen());

    // Primeiro frame: o addPostFrameCallback ainda nem rodou.
    expect(find.text('Nenhum projeto relacionado'), findsNothing);
    expect(find.byType(LoadingIndicator), findsOneWidget);

    // Callback disparado, requisicao ainda pendente.
    await tester.pump();
    expect(find.text('Nenhum projeto relacionado'), findsNothing);
    expect(find.byType(EmptyState), findsNothing);

    await _settle(tester, activity);
  });

  testWidgets('progresso nao diz "nenhum projeto" antes de carregar',
      (tester) async {
    final activity = await _pumpScreen(tester, const ProgressScreen());

    expect(find.text('Nenhum projeto relacionado'), findsNothing);
    expect(find.byType(LoadingIndicator), findsOneWidget);

    await tester.pump();
    expect(find.text('Nenhum projeto relacionado'), findsNothing);
    expect(find.byType(EmptyState), findsNothing);

    await _settle(tester, activity);
  });

  testWidgets('o estado vazio aparece quando o backend confirma que nao ha nada',
      (tester) async {
    final activity = await _pumpScreen(tester, const FeedbackScreen());
    await _settle(tester, activity);

    expect(find.text('Nenhum projeto relacionado'), findsOneWidget);
  });
}
