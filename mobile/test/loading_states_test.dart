import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/academic_workspace_provider.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/providers/chat_provider.dart';
import 'package:tcc_mobile/providers/dashboard_provider.dart';
import 'package:tcc_mobile/providers/notification_provider.dart';
import 'package:tcc_mobile/providers/project_provider.dart';
import 'package:tcc_mobile/providers/research_activity_provider.dart';
import 'package:tcc_mobile/screens/chat/chat_detail_screen.dart';
import 'package:tcc_mobile/screens/dashboard/dashboard_screen.dart';
import 'package:tcc_mobile/screens/projects/projects_list_screen.dart';
import 'package:tcc_mobile/widgets/common/app_error_state.dart';
import 'package:tcc_mobile/widgets/common/app_skeleton.dart';
import 'package:tcc_mobile/widgets/common/app_skeletons.dart';
import 'package:tcc_mobile/widgets/common/empty_state.dart';

class _FakeAuthProvider extends AuthProvider {
  _FakeAuthProvider() {
    token = 'test-token';
    currentUser = const User(
      id: 'user-1',
      name: 'Ana Teste',
      email: 'ana@example.com',
      type: 'ALUNO',
    );
  }
}

class _FakeDashboardProvider extends DashboardProvider {
  _FakeDashboardProvider({this.loading = false, String? error}) {
    isLoading = loading;
    errorMessage = error;
  }

  final bool loading;
  int loadCalls = 0;

  @override
  Future<void> load() async {
    loadCalls++;
    isLoading = loading;
    notifyListeners();
  }
}

class _FakeNotificationProvider extends NotificationProvider {
  int loadCalls = 0;

  @override
  Future<void> loadNotifications() async {
    loadCalls++;
  }
}

class _FakeResearchActivityProvider extends ResearchActivityProvider {
  int loadCalls = 0;

  @override
  Future<void> loadRelatedProjects() async {
    loadCalls++;
  }
}

class _FakeProjectProvider extends ProjectProvider {
  int loadCalls = 0;

  @override
  Future<void> loadProjects({
    String? search,
    String? status,
    String? area,
    String? course,
  }) async {
    loadCalls++;
  }
}

class _FakeChatProvider extends ChatProvider {
  final Completer<bool> sendCompleter = Completer<bool>();
  int sendCalls = 0;

  @override
  Future<void> loadConversations() async {}

  @override
  Future<void> loadMessages(String conversationId) async {}

  @override
  Future<bool> sendMessage(String conversationId, String content) {
    sendCalls++;
    return sendCompleter.future;
  }
}

Widget _dashboardApp({
  required DashboardProvider dashboard,
  required NotificationProvider notifications,
}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(value: _FakeAuthProvider()),
      ChangeNotifierProvider<DashboardProvider>.value(value: dashboard),
      ChangeNotifierProvider<NotificationProvider>.value(value: notifications),
      ChangeNotifierProvider<AcademicWorkspaceProvider>(
        create: (_) => AcademicWorkspaceProvider(),
      ),
      // O painel usa este provider para o grafico de situacao dos projetos.
      // Precisa ser fake: o real dispara HTTP e deixa timer pendente.
      ChangeNotifierProvider<ResearchActivityProvider>.value(
        value: _FakeResearchActivityProvider(),
      ),
    ],
    child: const MaterialApp(home: DashboardScreen()),
  );
}

void main() {
  testWidgets('skeleton fica estatico quando animacoes estao desativadas',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(disableAnimations: true),
          child: AppSkeleton(width: 120, height: 20),
        ),
      ),
    );

    final container = tester.widget<Container>(
      find.descendant(
        of: find.byType(AppSkeleton),
        matching: find.byType(Container),
      ),
    );
    final decoration = container.decoration! as BoxDecoration;
    expect(decoration.gradient, isNull);
    expect(decoration.color, isNotNull);
  });

  testWidgets('templates de skeleton nao transbordam em 320 px',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    const templates = <Widget>[
      DashboardSkeleton(),
      ProjectListSkeleton(),
      ProjectDetailSkeleton(),
      ConversationListSkeleton(),
      MessageListSkeleton(),
      NotificationListSkeleton(),
      ProfileSkeleton(),
      ListItemSkeleton(),
    ];

    for (final template in templates) {
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(disableAnimations: true),
            child: Scaffold(body: template),
          ),
        ),
      );
      expect(tester.takeException(), isNull, reason: '${template.runtimeType}');
    }
  });

  testWidgets('dashboard carregando mostra skeleton e nao mostra zeros',
      (tester) async {
    final dashboard = _FakeDashboardProvider(loading: true);
    final notifications = _FakeNotificationProvider();

    await tester.pumpWidget(
      _dashboardApp(dashboard: dashboard, notifications: notifications),
    );
    await tester.pump();

    expect(find.byType(DashboardSkeleton), findsOneWidget);
    expect(find.text('0'), findsNothing);
  });

  testWidgets('dashboard com erro mostra retry e refaz carregamento',
      (tester) async {
    final dashboard = _FakeDashboardProvider(error: 'Falha de rede');
    final notifications = _FakeNotificationProvider();

    await tester.pumpWidget(
      _dashboardApp(dashboard: dashboard, notifications: notifications),
    );
    await tester.pump();
    final callsAfterInitialLoad = dashboard.loadCalls;

    expect(find.byType(AppErrorState), findsOneWidget);
    expect(find.text('Falha de rede'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);

    await tester.tap(find.text('Tentar novamente'));
    await tester.pump();

    expect(dashboard.loadCalls, callsAfterInitialLoad + 1);
  });

  testWidgets('lista vazia sem erro mostra EmptyState e nao skeleton',
      (tester) async {
    final projects = _FakeProjectProvider();
    final auth = _FakeAuthProvider();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: auth),
          ChangeNotifierProvider<ProjectProvider>.value(value: projects),
        ],
        child: const MaterialApp(home: ProjectsListScreen()),
      ),
    );
    await tester.pump();

    expect(find.byType(EmptyState), findsOneWidget);
    expect(find.byType(ProjectListSkeleton), findsNothing);
  });

  testWidgets('envio em andamento nao dispara segunda mensagem',
      (tester) async {
    final chat = _FakeChatProvider();
    final auth = _FakeAuthProvider();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: auth),
          ChangeNotifierProvider<ChatProvider>.value(value: chat),
        ],
        child: const MaterialApp(
          home: ChatDetailScreen(conversationId: 'conversation-1'),
        ),
      ),
    );
    await tester.pump();
    await tester.enterText(find.byType(TextField).last, 'Mensagem de teste');
    // enterText faz idle(), nao pump(): sem este frame o botao ainda esta no
    // estado desabilitado de campo vazio.
    await tester.pump();

    final sendButton = find.byTooltip('Enviar mensagem');
    await tester.tap(sendButton);
    await tester.tap(sendButton);

    expect(chat.sendCalls, 1);
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    chat.sendCompleter.complete(true);
    await tester.pump();
  });
}
