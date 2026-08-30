import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/collab_logo.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 360;
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                compact ? 16 : 24,
                18,
                compact ? 16 : 24,
                28,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: TweenAnimationBuilder<double>(
                    duration: const Duration(milliseconds: 460),
                    curve: Curves.easeOutCubic,
                    tween: Tween(begin: 0, end: 1),
                    builder: (context, value, child) => Opacity(
                      opacity: value,
                      child: Transform.translate(
                        offset: Offset(0, 14 * (1 - value)),
                        child: child,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: CollabLogo(height: 28),
                              ),
                            ),
                            OutlinedButton(
                              onPressed: () => context.go('/login'),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size(0, 42),
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                              ),
                              child: const Text('Entrar'),
                            ),
                          ],
                        ),
                        SizedBox(height: compact ? 30 : 42),
                        Align(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: AppColors.highlight,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.full),
                            ),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 7,
                              ),
                              child: Text(
                                '●  Plataforma colaborativa acadêmica',
                                style: TextStyle(
                                  color: AppColors.primaryDark,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text.rich(
                          TextSpan(
                            text: 'Seu projeto acadêmico,\n',
                            children: [
                              const TextSpan(
                                text: 'organizado',
                                style: TextStyle(color: AppColors.primary),
                              ),
                              TextSpan(
                                text: ' do início ao fim.',
                                style: TextStyle(
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          textAlign: TextAlign.center,
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(
                                color: AppColors.text,
                                fontSize: compact ? 28 : 32,
                                height: 1.14,
                                letterSpacing: -0.9,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'O CollabResearch conecta estudantes e orientadores para planejar, acompanhar e entregar projetos juntos.',
                          textAlign: TextAlign.center,
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: AppColors.textMedium,
                                    height: 1.55,
                                  ),
                        ),
                        const SizedBox(height: 28),
                        AppButton(
                          label: 'Começar agora',
                          onPressed: () => context.go('/register'),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 52,
                          child: OutlinedButton(
                            onPressed: () => context.go('/login'),
                            child: const Text('Já tenho conta — Entrar'),
                          ),
                        ),
                        const SizedBox(height: 30),
                        const _CollaborationVisual(),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CollaborationVisual extends StatelessWidget {
  const _CollaborationVisual();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'CollabResearch, colaboração acadêmica',
      child: Container(
        height: 245,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
          boxShadow: AppElevation.floating,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(
              width: 390,
              height: 260,
              bottom: -96,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.highlight.withValues(alpha: 0.52),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const Positioned(
              top: 24,
              right: 34,
              child: _FloatingNote(
                color: AppColors.color1,
                icon: Icons.calendar_today_outlined,
              ),
            ),
            const Positioned(
              top: 62,
              left: 38,
              child: _FloatingNote(
                color: Color(0xFFFFE8BD),
                icon: Icons.description_outlined,
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CollabLogo(full: false, height: 52),
                const SizedBox(height: 12),
                Text(
                  'CollabResearch',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  'Planeje • Colabore • Entregue',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FloatingNote extends StatelessWidget {
  const _FloatingNote({required this.color, required this.icon});

  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -0.08,
      child: Container(
        width: 54,
        height: 54,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(14),
          boxShadow: AppElevation.floating,
        ),
        child: Icon(icon, color: AppColors.primaryDark),
      ),
    );
  }
}
