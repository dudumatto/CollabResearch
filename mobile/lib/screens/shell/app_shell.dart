import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/common/collab_logo.dart';

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
                    for (var index = 0; index < _destinations.length; index++)
                      NavigationDestination(
                        icon: _AnimatedNavigationIcon(
                          icon: _destinations[index].icon,
                          selected: navigationShell.currentIndex == index,
                        ),
                        label: _destinations[index].label,
                      ),
                  ],
                ),
        );
      },
    );
  }
}

class _AnimatedNavigationIcon extends StatelessWidget {
  const _AnimatedNavigationIcon({
    required this.icon,
    required this.selected,
  });

  final IconData icon;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    const duration = Duration(milliseconds: 180);
    return AnimatedSlide(
      duration: duration,
      curve: Curves.easeOutCubic,
      offset: selected ? const Offset(0, -0.08) : Offset.zero,
      child: AnimatedScale(
        duration: duration,
        curve: Curves.easeOutBack,
        scale: selected ? 1.12 : 1,
        child: Icon(icon),
      ),
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
    return const SizedBox(
      height: 42,
      width: 42,
      child: Center(
        child: CollabLogo(full: false, height: 32),
      ),
    );
  }
}
