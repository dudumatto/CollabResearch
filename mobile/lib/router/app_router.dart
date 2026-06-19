import 'package:go_router/go_router.dart';

import '../core/navigation/navigation_service.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/chat/chat_detail_screen.dart';
import '../screens/chat/chat_list_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/feedback/feedback_screen.dart';
import '../screens/landing/landing_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/projects/create_project_screen.dart';
import '../screens/projects/edit_project_screen.dart';
import '../screens/projects/project_detail_screen.dart';
import '../screens/projects/projects_list_screen.dart';
import '../screens/progress/progress_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/subscriptions/subscriptions_screen.dart';
import '../screens/shell/app_shell.dart';

GoRouter createAppRouter(AuthProvider authProvider) {
  return GoRouter(
    navigatorKey: NavigationService.rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final location = state.matchedLocation;
      final publicRoutes = <String>{'/', '/login', '/register'};
      final isPublic = publicRoutes.contains(location);
      final authenticated = authProvider.isAuthenticated;

      if (!authenticated && !isPublic) {
        authProvider.setPendingRedirect(state.uri.toString());
        return '/login';
      }

      if (authenticated && (location == '/login' || location == '/register')) {
        final pending = authProvider.pendingRedirectLocation;
        if (pending != null && pending.isNotEmpty) {
          authProvider.clearPendingRedirect();
          return pending;
        }
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: LandingScreen(),
        ),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: RegisterScreen(),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: DashboardScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/projects',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: ProjectsListScreen(),
                ),
                routes: [
                  GoRoute(
                    path: 'create',
                    builder: (context, state) => const CreateProjectScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => ProjectDetailScreen(
                        projectId: state.pathParameters['id']!),
                    routes: [
                      GoRoute(
                        path: 'edit',
                        builder: (context, state) => EditProjectScreen(
                          projectId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/chat',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: ChatListScreen(),
                ),
                routes: [
                  GoRoute(
                    path: ':conversationId',
                    builder: (context, state) {
                      final extra = state.extra;
                      return ChatDetailScreen(
                        conversationId: state.pathParameters['conversationId']!,
                        conversationTitle: extra is String ? extra : null,
                        targetMessageId:
                            state.uri.queryParameters['messageId'] ??
                                state.uri.queryParameters['mensagemId'],
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notifications',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: NotificationsScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: ProfileScreen(),
                ),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/subscriptions',
        builder: (context, state) => const SubscriptionsScreen(),
      ),
      GoRoute(
        path: '/progress',
        builder: (context, state) => const ProgressScreen(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (context, state) => const FeedbackScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
}
