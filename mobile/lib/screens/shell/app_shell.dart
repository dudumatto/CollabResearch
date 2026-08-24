import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/chat_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/collab_logo.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  static const _destinations = [
    _ShellDestination(Icons.space_dashboard_outlined, 'Dashboard'),
    _ShellDestination(Icons.folder_open_outlined, 'Projetos'),
    _ShellDestination(Icons.chat_bubble_outline, 'Chat'),
    _ShellDestination(Icons.notifications_none, 'Alertas'),
    _ShellDestination(Icons.person_outline, 'Perfil'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadConversations();
      context.read<DashboardProvider>().load();
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatUnreadCount = context.watch<ChatProvider>().unreadCount;
    final notificationUnreadCount =
        context.watch<NotificationProvider>().unreadCount;

    return LayoutBuilder(
      builder: (context, constraints) {
        final useRail = constraints.maxWidth >= 760;

        return Scaffold(
          body: Row(
            children: [
              if (useRail)
                SafeArea(
                  child: NavigationRail(
                    selectedIndex: widget.navigationShell.currentIndex,
                    onDestinationSelected: widget.navigationShell.goBranch,
                    labelType: NavigationRailLabelType.all,
                    minWidth: 88,
                    leading: const Padding(
                      padding: EdgeInsets.only(top: 12, bottom: 24),
                      child: _BrandMark(),
                    ),
                    destinations: [
                      for (final destination in _destinations)
                        NavigationRailDestination(
                          icon: _NavigationIcon(
                            icon: destination.icon,
                            count: _badgeCount(
                              destination.label,
                              chatUnreadCount,
                              notificationUnreadCount,
                            ),
                          ),
                          selectedIcon: _NavigationIcon(
                            icon: destination.icon,
                            count: _badgeCount(
                              destination.label,
                              chatUnreadCount,
                              notificationUnreadCount,
                            ),
                          ),
                          label: Text(destination.label),
                        ),
                    ],
                  ),
                ),
              if (useRail) const VerticalDivider(width: 1),
              Expanded(child: widget.navigationShell),
            ],
          ),
          bottomNavigationBar: useRail
              ? null
              : NavigationBar(
                  selectedIndex: widget.navigationShell.currentIndex,
                  onDestinationSelected: widget.navigationShell.goBranch,
                  destinations: [
                    for (var index = 0; index < _destinations.length; index++)
                      NavigationDestination(
                        icon: _AnimatedNavigationIcon(
                          icon: _destinations[index].icon,
                          selected:
                              widget.navigationShell.currentIndex == index,
                          count: _badgeCount(
                            _destinations[index].label,
                            chatUnreadCount,
                            notificationUnreadCount,
                          ),
                        ),
                        label: _destinations[index].label,
                      ),
                  ],
                ),
        );
      },
    );
  }

  int _badgeCount(
    String label,
    int chatUnreadCount,
    int notificationUnreadCount,
  ) {
    return switch (label) {
      'Chat' => chatUnreadCount,
      'Alertas' => notificationUnreadCount,
      _ => 0,
    };
  }
}

class _AnimatedNavigationIcon extends StatelessWidget {
  const _AnimatedNavigationIcon({
    required this.icon,
    required this.selected,
    required this.count,
  });

  final IconData icon;
  final bool selected;
  final int count;

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
        child: _NavigationIcon(icon: icon, count: count),
      ),
    );
  }
}

class _NavigationIcon extends StatelessWidget {
  const _NavigationIcon({required this.icon, required this.count});

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Badge.count(
      count: count > 99 ? 99 : count,
      isLabelVisible: count > 0,
      child: Icon(icon),
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
