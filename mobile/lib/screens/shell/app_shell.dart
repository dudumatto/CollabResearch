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
    _ShellDestination(Icons.home_rounded, 'Início'),
    _ShellDestination(Icons.folder_rounded, 'Projetos'),
    _ShellDestination(Icons.chat_bubble_rounded, 'Chat'),
    _ShellDestination(Icons.calendar_month_rounded, 'Agenda'),
    _ShellDestination(Icons.notifications_rounded, 'Alertas'),
    _ShellDestination(Icons.person_rounded, 'Perfil'),
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

class _MobileNavigationBar extends StatefulWidget {
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
  State<_MobileNavigationBar> createState() => _MobileNavigationBarState();
}

class _MobileNavigationBarState extends State<_MobileNavigationBar> {
  int? _pressedIndex;

  void _handleDestinationSelected(int index) {
    setState(() => _pressedIndex = index);
    widget.onDestinationSelected(index);

    Future<void>.delayed(const Duration(milliseconds: 170), () {
      if (mounted && _pressedIndex == index) {
        setState(() => _pressedIndex = null);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final isUltraCompact = width <= 340;
    final isCompact = width <= 380;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final extraHeight = ((textScale - 1).clamp(0, 1)).toDouble() * 20;
    final baseHeight = isUltraCompact ? 66.0 : (isCompact ? 70.0 : 74.0);
    final iconSize = isUltraCompact ? 22.0 : (isCompact ? 23.0 : 24.0);

    return SafeArea(
      top: false,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          // Separa a barra do conteudo: borda fina no topo mais uma sombra
          // curta para cima, em vez da barra flutuar sem delimitacao.
          border: Border(
            top: BorderSide(color: colorScheme.outlineVariant, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          key: ValueKey('mobile-navigation-selected-${widget.selectedIndex}'),
          height: baseHeight + extraHeight,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final (index, destination) in widget.destinations.indexed)
                Expanded(
                  child: Semantics(
                    selected: widget.selectedIndex == index,
                    button: true,
                    label: destination.label,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        key: ValueKey(
                          'mobile-navigation-${destination.label}',
                        ),
                        onTap: () => _handleDestinationSelected(index),
                        borderRadius: BorderRadius.circular(16),
                        overlayColor: WidgetStatePropertyAll(
                          colorScheme.primary.withValues(alpha: 0.07),
                        ),
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(
                            isUltraCompact ? 1 : 2,
                            8,
                            isUltraCompact ? 1 : 2,
                            6,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _AnimatedNavigationIcon(
                                icon: destination.icon,
                                selected: widget.selectedIndex == index,
                                pressed: _pressedIndex == index,
                                count: widget.badgeCount(
                                  destination.label,
                                  widget.chatUnreadCount,
                                  widget.notificationUnreadCount,
                                ),
                                iconSize: iconSize,
                              ),
                              const SizedBox(height: 5),
                              AnimatedDefaultTextStyle(
                                duration: const Duration(milliseconds: 200),
                                curve: Curves.easeInOut,
                                style: TextStyle(
                                  color: widget.selectedIndex == index
                                      ? colorScheme.primary
                                      : colorScheme.onSurfaceVariant,
                                  fontSize: isUltraCompact
                                      ? 10.5
                                      : (isCompact ? 11 : 11.5),
                                  fontWeight: widget.selectedIndex == index
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  letterSpacing: 0.1,
                                  height: 1.05,
                                ),
                                child: Text(
                                  destination.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.fade,
                                  softWrap: false,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
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
    required this.pressed,
    required this.count,
    required this.iconSize,
  });

  final IconData icon;
  final bool selected;
  final bool pressed;
  final int count;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    const duration = Duration(milliseconds: 180);
    final colorScheme = Theme.of(context).colorScheme;
    final foreground = selected
        ? colorScheme.primary
        : colorScheme.onSurfaceVariant.withValues(alpha: 0.9);

    // Um unico indicador: a capsula atras do icone. O sublinhado anterior
    // competia com ela e deixava o icone fora do centro.
    return AnimatedScale(
      duration: duration,
      curve: Curves.easeOutBack,
      scale: pressed ? 1.10 : 1,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 210),
        curve: Curves.easeInOut,
        height: 32,
        width: selected ? 58 : 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? colorScheme.primary.withValues(alpha: 0.14)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: _NavigationIcon(
          icon: icon,
          count: count,
          color: foreground,
          size: iconSize,
        ),
      ),
    );
  }
}

class _NavigationIcon extends StatelessWidget {
  const _NavigationIcon({
    required this.icon,
    required this.count,
    this.color,
    this.size,
  });

  final IconData icon;
  final int count;
  final Color? color;
  final double? size;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    // Stack em vez de Badge.count: o Badge reserva espaco a direita do
    // filho e desloca o icone, tirando ele do centro da capsula.
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Icon(icon, color: color, size: size),
        if (count > 0)
          Positioned(
            top: -5,
            right: -9,
            child: Container(
              constraints: const BoxConstraints(minWidth: 16),
              height: 16,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: colorScheme.error,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: colorScheme.surface, width: 1.5),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: TextStyle(
                  color: colorScheme.onError,
                  fontSize: 9.5,
                  height: 1,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
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
