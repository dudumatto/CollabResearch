import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/user_role.dart';
import '../../providers/auth_provider.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _studentDestinations = [
    _ShellDestination(Icons.space_dashboard_outlined, 'Painel'),
    _ShellDestination(Icons.folder_open_outlined, 'Projetos'),
    _ShellDestination(Icons.chat_bubble_outline, 'Chat'),
    _ShellDestination(Icons.notifications_none, 'Alertas'),
    _ShellDestination(Icons.person_outline, 'Perfil'),
  ];

  static const _advisorDestinations = [
    _ShellDestination(Icons.space_dashboard_outlined, 'Painel'),
    _ShellDestination(Icons.school_outlined, 'Orientacoes'),
    _ShellDestination(Icons.forum_outlined, 'Mensagens'),
    _ShellDestination(Icons.notifications_none, 'Alertas'),
    _ShellDestination(Icons.person_outline, 'Perfil'),
  ];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    final destinations =
        isAdvisor(user) ? _advisorDestinations : _studentDestinations;

    return LayoutBuilder(
      builder: (context, constraints) {
        final useRail = constraints.maxWidth >= 760;

        return Scaffold(
          body: Row(
            children: [
              if (useRail)
                SafeArea(
                  child: NavigationRail(
                    selectedIndex: navigationShell.currentIndex,
                    onDestinationSelected: navigationShell.goBranch,
                    labelType: NavigationRailLabelType.all,
                    minWidth: 92,
                    leading: const Padding(
                      padding: EdgeInsets.only(top: 12, bottom: 24),
                      child: _BrandMark(),
                    ),
                    destinations: [
                      for (final destination in destinations)
                        NavigationRailDestination(
                          icon: Icon(destination.icon),
                          selectedIcon: Icon(destination.icon),
                          label: Text(destination.label),
                        ),
                    ],
                  ),
                ),
              if (useRail) const VerticalDivider(width: 1),
              Expanded(child: navigationShell),
            ],
          ),
          bottomNavigationBar: useRail
              ? null
              : DecoratedBox(
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(top: BorderSide(color: AppColors.border)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 24,
                        offset: Offset(0, -10),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: NavigationBar(
                      selectedIndex: navigationShell.currentIndex,
                      onDestinationSelected: navigationShell.goBranch,
                      destinations: [
                        for (final destination in destinations)
                          NavigationDestination(
                            icon: Icon(destination.icon),
                            selectedIcon: Icon(destination.icon),
                            label: destination.label,
                          ),
                      ],
                    ),
                  ),
                ),
        );
      },
    );
  }
}

class _ShellDestination {
  const _ShellDestination(this.icon, this.label);

  final IconData icon;
  final String label;
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: const SizedBox(
        height: 46,
        width: 46,
        child: Center(
          child: Image(
            image: AssetImage('assets/brand/logo-icon.png'),
            width: 28,
            height: 28,
            semanticLabel: 'CollabResearch',
          ),
        ),
      ),
    );
  }
}
