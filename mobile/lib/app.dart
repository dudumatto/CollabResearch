import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'core/auth/session_key.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/academic_workspace_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/project_provider.dart';
import 'providers/research_activity_provider.dart';
import 'providers/subscription_provider.dart';
import 'router/app_router.dart';

class TccMobileApp extends StatefulWidget {
  const TccMobileApp({super.key, required this.authProvider});

  final AuthProvider authProvider;

  @override
  State<TccMobileApp> createState() => _TccMobileAppState();
}

class _TccMobileAppState extends State<TccMobileApp> {
  late final _router = createAppRouter(widget.authProvider);


  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final sessionKey = sessionKeyFor(auth.currentUser);

    return MultiProvider(
      key: ValueKey<String>(sessionKey),
      providers: [
        ChangeNotifierProvider<ProjectProvider>(
          create: (_) => ProjectProvider(),
        ),
        ChangeNotifierProvider<ChatProvider>(
          create: (_) => ChatProvider(),
        ),
        ChangeNotifierProvider<NotificationProvider>(
          create: (_) => NotificationProvider(),
        ),
        ChangeNotifierProvider<DashboardProvider>(
          create: (_) => DashboardProvider(),
        ),
        ChangeNotifierProvider<SubscriptionProvider>(
          create: (_) => SubscriptionProvider(),
        ),
        ChangeNotifierProvider<ResearchActivityProvider>(
          create: (_) => ResearchActivityProvider(),
        ),
        ChangeNotifierProvider<AcademicWorkspaceProvider>(
          create: (_) => AcademicWorkspaceProvider(),
        ),
      ],
      child: MaterialApp.router(
        title: 'CollabResearch',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: auth.themeMode,
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        supportedLocales: const [Locale('pt', 'BR')],
        locale: const Locale('pt', 'BR'),
        routerConfig: _router,
      ),
    );
  }
}
