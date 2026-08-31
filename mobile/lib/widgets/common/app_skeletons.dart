import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import 'app_skeleton.dart';

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _SkeletonPage(
      maxWidth: 1180,
      children: [
        const Row(
          children: [
            Expanded(child: AppSkeleton(width: 72, height: 24)),
            AppSkeletonCircle(size: 40),
            SizedBox(width: AppSpacing.sm),
            AppSkeletonCircle(size: 40),
          ],
        ),
        const SizedBox(height: 26),
        const AppSkeleton(width: 220, height: 28),
        const SizedBox(height: AppSpacing.sm),
        const AppSkeleton(width: 300, height: 16),
        const SizedBox(height: AppSpacing.xl),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = AppSpacing.md;
            final width = (constraints.maxWidth - gap) / 2;
            return Wrap(
              spacing: gap,
              runSpacing: gap,
              children: [
                for (var index = 0; index < 4; index++)
                  SizedBox(
                    width: width,
                    child: const AppSkeleton(height: 112),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: AppSpacing.xl),
        const AppSkeleton(width: 150, height: 20),
        const SizedBox(height: AppSpacing.md),
        const AppSkeleton(height: 180, borderRadius: AppRadius.md),
        const SizedBox(height: AppSpacing.lg),
        for (var index = 0; index < 4; index++) ...[
          const ListItemSkeleton(),
          if (index < 3) const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class ProjectListSkeleton extends StatelessWidget {
  const ProjectListSkeleton({super.key, this.itemCount = 4});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return _SkeletonPage(
      maxWidth: 1180,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        const AppSkeleton(height: 56, borderRadius: AppRadius.md),
        const SizedBox(height: AppSpacing.md),
        const AppSkeleton(height: 48, borderRadius: AppRadius.md),
        const SizedBox(height: AppSpacing.lg),
        for (var index = 0; index < itemCount; index++) ...[
          const _ProjectCardSkeleton(),
          if (index < itemCount - 1) const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class ProjectDetailSkeleton extends StatelessWidget {
  const ProjectDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const _SkeletonPage(
      maxWidth: 760,
      padding: EdgeInsets.all(AppSpacing.xl),
      children: [
        AppSkeleton(width: 280, height: 30),
        SizedBox(height: AppSpacing.md),
        AppSkeleton(width: 110, height: 28, borderRadius: AppRadius.pill),
        SizedBox(height: AppSpacing.xl),
        AppSkeleton(width: 170, height: 20),
        SizedBox(height: AppSpacing.md),
        AppSkeletonText(lines: 4),
        SizedBox(height: AppSpacing.lg),
        AppSkeleton(width: 230, height: 16),
        SizedBox(height: AppSpacing.xl),
        AppSkeleton(width: 130, height: 20),
        SizedBox(height: AppSpacing.md),
        ListItemSkeleton(),
        SizedBox(height: AppSpacing.xl),
        AppSkeleton(height: 48, borderRadius: AppRadius.md),
      ],
    );
  }
}

class ConversationListSkeleton extends StatelessWidget {
  const ConversationListSkeleton({super.key, this.itemCount = 6});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return _SkeletonPage(
      maxWidth: 760,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        const AppSkeleton(width: 260, height: 16),
        const SizedBox(height: AppSpacing.lg),
        const AppSkeleton(height: 56, borderRadius: AppRadius.md),
        const SizedBox(height: AppSpacing.lg),
        for (var index = 0; index < itemCount; index++) ...[
          const ListItemSkeleton(showTime: true),
          if (index < itemCount - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class MessageListSkeleton extends StatelessWidget {
  const MessageListSkeleton({super.key, this.itemCount = 7});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
      children: [
        for (var index = 0; index < itemCount; index++) ...[
          Align(
            alignment:
                index.isEven ? Alignment.centerLeft : Alignment.centerRight,
            child: FractionallySizedBox(
              widthFactor: index % 3 == 0 ? 0.58 : 0.76,
              child: AppSkeleton(
                height: index % 3 == 1 ? 72 : 54,
                borderRadius: AppRadius.md,
              ),
            ),
          ),
          if (index < itemCount - 1) const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class NotificationListSkeleton extends StatelessWidget {
  const NotificationListSkeleton({super.key, this.itemCount = 6});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return _SkeletonPage(
      maxWidth: 720,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        const Row(
          children: [
            Expanded(child: AppSkeleton(width: 140, height: 20)),
            AppSkeleton(width: 116, height: 40),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        for (var index = 0; index < itemCount; index++) ...[
          const ListItemSkeleton(showTime: true, iconIsCircle: false),
          if (index < itemCount - 1) const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const _SkeletonPage(
      maxWidth: 920,
      children: [
        Stack(
          alignment: Alignment.topCenter,
          children: [
            Padding(
              padding: EdgeInsets.only(top: 32),
              child: AppSkeleton(height: 250, borderRadius: AppRadius.md),
            ),
            Column(
              children: [
                AppSkeletonCircle(size: 76),
                SizedBox(height: AppSpacing.md),
                AppSkeleton(width: 180, height: 24),
                SizedBox(height: AppSpacing.sm),
                AppSkeleton(width: 130, height: 16),
                SizedBox(height: AppSpacing.xl),
              ],
            ),
          ],
        ),
        SizedBox(height: AppSpacing.lg),
        AppSkeleton(height: 220, borderRadius: AppRadius.md),
        SizedBox(height: AppSpacing.lg),
        AppSkeleton(height: 420, borderRadius: AppRadius.md),
      ],
    );
  }
}

class ListItemSkeleton extends StatelessWidget {
  const ListItemSkeleton({
    super.key,
    this.showTime = false,
    this.iconIsCircle = true,
  });

  final bool showTime;
  final bool iconIsCircle;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 72,
      child: Row(
        children: [
          if (iconIsCircle)
            const AppSkeletonCircle(size: 48)
          else
            const AppSkeleton(width: 48, height: 48),
          const SizedBox(width: AppSpacing.md),
          const Expanded(child: AppSkeletonText(lines: 2, lineHeight: 13)),
          if (showTime) ...[
            const SizedBox(width: AppSpacing.md),
            const AppSkeleton(width: 42, height: 12),
          ],
        ],
      ),
    );
  }
}

class _ProjectCardSkeleton extends StatelessWidget {
  const _ProjectCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 174,
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: AppSkeleton(height: 20)),
                SizedBox(width: AppSpacing.md),
                AppSkeleton(width: 92, height: 28),
              ],
            ),
            SizedBox(height: AppSpacing.md),
            AppSkeletonText(lines: 2, lineHeight: 13),
            Spacer(),
            AppSkeleton(height: 8, borderRadius: AppRadius.pill),
            SizedBox(height: AppSpacing.md),
            AppSkeleton(width: 180, height: 12),
          ],
        ),
      ),
    );
  }
}

class _SkeletonPage extends StatelessWidget {
  const _SkeletonPage({
    required this.children,
    required this.maxWidth,
    this.padding = const EdgeInsets.fromLTRB(24, 20, 24, 24),
  });

  final List<Widget> children;
  final double maxWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: padding,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ),
      ],
    );
  }
}
