import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _destinations = [
    _ShellDestination(Icons.space_dashboard_outlined, 'Dashboard'),
    _ShellDestination(Icons.folder_open_outlined, 'Projetos'),
    _ShellDestination(Icons.chat_bubble_outline, 'Chat'),
    _ShellDestination(Icons.notifications_none, 'Alertas'),
    _ShellDestination(Icons.person_outline, 'Perfil'),
  ];

  @override
  Widget build(BuildContext context) {
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
                    minWidth: 88,
                    leading: const Padding(
                      padding: EdgeInsets.only(top: 12, bottom: 24),
                      child: _BrandMark(),
                    ),
                    destinations: [
                      for (final destination in _destinations)
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
              : NavigationBar(
                  selectedIndex: navigationShell.currentIndex,
                  onDestinationSelected: navigationShell.goBranch,
                  destinations: [
                    for (final destination in _destinations)
                      NavigationDestination(
                        icon: Icon(destination.icon),
                        label: destination.label,
                      ),
                  ],
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
        color: Theme.of(context).colorScheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const SizedBox(
        height: 42,
        width: 42,
        child: Center(
          child: Text(
            'CR',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
        ),
      ),
    );
  }
}
