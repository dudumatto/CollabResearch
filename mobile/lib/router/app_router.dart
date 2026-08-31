import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/animation/app_durations.dart';
import '../core/navigation/navigation_service.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/advisees/advisee_detail_screen.dart';
import '../screens/advisees/advisees_screen.dart';
import '../screens/chat/chat_detail_screen.dart';
import '../screens/chat/chat_list_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/deliveries/deliveries_screen.dart';
import '../screens/documents/documents_screen.dart';
import '../screens/evaluations/evaluations_screen.dart';
import '../screens/feedback/feedback_screen.dart';
import '../screens/landing/landing_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/user_profile_screen.dart';
import '../screens/projects/create_project_screen.dart';
import '../screens/projects/edit_project_screen.dart';
import '../screens/projects/project_detail_screen.dart';
import '../screens/projects/projects_list_screen.dart';
import '../screens/progress/progress_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/subscriptions/subscriptions_screen.dart';
import '../screens/shell/app_shell.dart';
import '../screens/agenda/agenda_screen.dart';

CustomTransitionPage<void> _fadePage(
  BuildContext context,
  GoRouterState state,
  Widget child, {
  Duration duration = AppDurations.normal,
}) {
  final animationsDisabled = MediaQuery.disableAnimationsOf(context);
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: animationsDisabled ? AppDurations.instant : duration,
    reverseTransitionDuration:
        animationsDisabled ? AppDurations.instant : duration,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (animationsDisabled) return child;
      return FadeTransition(
        opacity: CurvedAnimation(
          parent: animation,
          curve: AppCurves.enter,
          reverseCurve: AppCurves.exit,
        ),
        child: child,
      );
    },
  );
}

CustomTransitionPage<void> _slidePage(
  BuildContext context,
  GoRouterState state,
  Widget child,
) {
  final animationsDisabled = MediaQuery.disableAnimationsOf(context);
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration:
        animationsDisabled ? AppDurations.instant : AppDurations.normal,
    reverseTransitionDuration:
        animationsDisabled ? AppDurations.instant : AppDurations.normal,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (animationsDisabled) return child;
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppCurves.enter,
        reverseCurve: AppCurves.exit,
      );
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.08, 0),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      );
    },
  );
}

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

      if (authenticated && location == '/') {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (context, state) =>
            _fadePage(context, state, const LandingScreen()),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) =>
            _fadePage(context, state, const LoginScreen()),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) =>
            _fadePage(context, state, const RegisterScreen()),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  const DashboardScreen(),
                  duration: AppDurations.fast,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/projects',
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  const ProjectsListScreen(),
                  duration: AppDurations.fast,
                ),
                routes: [
                  GoRoute(
                    path: 'create',
                    pageBuilder: (context, state) => _slidePage(
                      context,
                      state,
                      const CreateProjectScreen(),
                    ),
                  ),
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) => _slidePage(
                      context,
                      state,
                      ProjectDetailScreen(
                        projectId: state.pathParameters['id']!,
                      ),
                    ),
                    routes: [
                      GoRoute(
                        path: 'edit',
                        pageBuilder: (context, state) => _slidePage(
                          context,
                          state,
                          EditProjectScreen(
                            projectId: state.pathParameters['id']!,
                          ),
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
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  const ChatListScreen(),
                  duration: AppDurations.fast,
                ),
                routes: [
                  GoRoute(
                    path: ':conversationId',
                    pageBuilder: (context, state) {
                      final extra = state.extra;
                      return _slidePage(
                        context,
                        state,
                        ChatDetailScreen(
                          conversationId:
                              state.pathParameters['conversationId']!,
                          conversationTitle: extra is String ? extra : null,
                          targetMessageId:
                              state.uri.queryParameters['messageId'] ??
                                  state.uri.queryParameters['mensagemId'],
                        ),
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
                path: '/agenda',
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  AgendaScreen(
                    projectId: state.uri.queryParameters['projectId'],
                  ),
                  duration: AppDurations.fast,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notifications',
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  const NotificationsScreen(),
                  duration: AppDurations.fast,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) => _fadePage(
                  context,
                  state,
                  const ProfileScreen(),
                  duration: AppDurations.fast,
                ),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/advisees',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const AdviseesScreen()),
        routes: [
          GoRoute(
            path: ':studentId',
            pageBuilder: (context, state) => _slidePage(
              context,
              state,
              AdviseeDetailScreen(
                studentId: state.pathParameters['studentId']!,
                projectId: state.uri.queryParameters['projectId'],
              ),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/documents',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const DocumentsScreen()),
      ),
      GoRoute(
        path: '/users/:id',
        pageBuilder: (context, state) => _slidePage(
          context,
          state,
          UserProfileScreen(userId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/deliveries',
        pageBuilder: (context, state) => _slidePage(
          context,
          state,
          DeliveriesScreen(
            projectId: state.uri.queryParameters['projectId'],
          ),
        ),
      ),
      GoRoute(
        path: '/evaluations',
        pageBuilder: (context, state) => _slidePage(
          context,
          state,
          EvaluationsScreen(
            projectId: state.uri.queryParameters['projectId'],
          ),
        ),
      ),
      GoRoute(
        path: '/subscriptions',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const SubscriptionsScreen()),
      ),
      GoRoute(
        path: '/progress',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const ProgressScreen()),
      ),
      GoRoute(
        path: '/feedback',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const FeedbackScreen()),
      ),
      GoRoute(
        path: '/settings',
        pageBuilder: (context, state) =>
            _slidePage(context, state, const SettingsScreen()),
      ),
    ],
  );
}
