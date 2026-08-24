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

class _AppShellState extends State<AppShell>
    with SingleTickerProviderStateMixin {
  static const _destinations = [
    _ShellDestination(Icons.space_dashboard_outlined, 'Dashboard'),
    _ShellDestination(Icons.folder_open_outlined, 'Projetos'),
    _ShellDestination(Icons.chat_bubble_outline, 'Chat'),
    _ShellDestination(Icons.notifications_none, 'Alertas'),
    _ShellDestination(Icons.person_outline, 'Perfil'),
  ];

  late final AnimationController _pageTransitionController;
  late final Animation<double> _pageOpacity;
  late final Animation<Offset> _pageOffset;

  @override
  void initState() {
    super.initState();
    _pageTransitionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
      value: 1,
    );
    final pageCurve = CurvedAnimation(
      parent: _pageTransitionController,
      curve: Curves.easeOutCubic,
    );
    _pageOpacity = Tween<double>(begin: 0.86, end: 1).animate(pageCurve);
    _pageOffset = Tween<Offset>(
      begin: const Offset(0.015, 0),
      end: Offset.zero,
    ).animate(pageCurve);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadConversations();
      context.read<DashboardProvider>().load();
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  void dispose() {
    _pageTransitionController.dispose();
    super.dispose();
  }

  void _goBranch(int index) {
    if (index == widget.navigationShell.currentIndex) {
      widget.navigationShell.goBranch(index);
      return;
    }

    widget.navigationShell.goBranch(index);
    _pageTransitionController.forward(from: 0);
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
                    onDestinationSelected: _goBranch,
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
              Expanded(
                child: FadeTransition(
                  opacity: _pageOpacity,
                  child: SlideTransition(
                    position: _pageOffset,
                    child: widget.navigationShell,
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: useRail
              ? null
              : _MobileNavigationBar(
                  destinations: _destinations,
                  selectedIndex: widget.navigationShell.currentIndex,
                  onDestinationSelected: _goBranch,
                  chatUnreadCount: chatUnreadCount,
                  notificationUnreadCount: notificationUnreadCount,
                  badgeCount: _badgeCount,
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

class _MobileNavigationBar extends StatelessWidget {
  const _MobileNavigationBar({
    required this.destinations,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.chatUnreadCount,
    required this.notificationUnreadCount,
    required this.badgeCount,
  });

  final List<_ShellDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final int chatUnreadCount;
  final int notificationUnreadCount;
  final int Function(String, int, int) badgeCount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isCompact = MediaQuery.sizeOf(context).width < 360;

    return SafeArea(
      minimum:
          EdgeInsets.fromLTRB(isCompact ? 8 : 12, 0, isCompact ? 8 : 12, 8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: colorScheme.outlineVariant.withValues(alpha: 0.7),
          ),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: Colors.transparent,
              elevation: 0,
              height: isCompact ? 68 : 72,
              indicatorColor: colorScheme.primary,
              indicatorShape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                final selected = states.contains(WidgetState.selected);
                return TextStyle(
                  color: selected
                      ? colorScheme.primary
                      : colorScheme.onSurfaceVariant,
                  fontSize: isCompact ? 10 : 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                );
              }),
            ),
            child: NavigationBar(
              selectedIndex: selectedIndex,
              onDestinationSelected: onDestinationSelected,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                for (final destination in destinations)
                  NavigationDestination(
                    icon: _AnimatedNavigationIcon(
                      icon: destination.icon,
                      selected: false,
                      count: badgeCount(
                        destination.label,
                        chatUnreadCount,
                        notificationUnreadCount,
                      ),
                      color: colorScheme.onSurfaceVariant,
                    ),
                    selectedIcon: _AnimatedNavigationIcon(
                      icon: destination.icon,
                      selected: true,
                      count: badgeCount(
                        destination.label,
                        chatUnreadCount,
                        notificationUnreadCount,
                      ),
                      color: colorScheme.onPrimary,
                    ),
                    label: destination.label,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedNavigationIcon extends StatelessWidget {
  const _AnimatedNavigationIcon({
    required this.icon,
    required this.selected,
    required this.count,
    this.color,
  });

  final IconData icon;
  final bool selected;
  final int count;
  final Color? color;

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
        child: _NavigationIcon(icon: icon, count: count, color: color),
      ),
    );
  }
}

class _NavigationIcon extends StatelessWidget {
  const _NavigationIcon({
    required this.icon,
    required this.count,
    this.color,
  });

  final IconData icon;
  final int count;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Badge.count(
      count: count > 99 ? 99 : count,
      isLabelVisible: count > 0,
      child: Icon(icon, color: color),
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
