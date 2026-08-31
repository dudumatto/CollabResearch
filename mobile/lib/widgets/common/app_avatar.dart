import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.radius = 24,
    this.backgroundColor,
    this.foregroundColor,
    this.initials,
  });

  final String name;
  final String? imageUrl;
  final double radius;
  final Color? backgroundColor;
  final Color? foregroundColor;

  /// Iniciais exibidas quando nao ha imagem. Quando nulo, usa a primeira
  /// letra de [name].
  final String? initials;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final background = backgroundColor ?? theme.colorScheme.primaryContainer;
    final foreground = foregroundColor ?? theme.colorScheme.onPrimaryContainer;
    final override = initials?.trim() ?? '';
    final initial = override.isNotEmpty
        ? override.toUpperCase()
        : (name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase());
    final size = radius * 2;

    Widget fallback() => ColoredBox(
          color: background,
          child: Center(
            child: Text(
              initial,
              style: theme.textTheme.titleMedium?.copyWith(
                color: foreground,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        );

    return Semantics(
      image: imageUrl?.trim().isNotEmpty == true,
      label: 'Avatar de $name',
      child: ClipOval(
        child: SizedBox.square(
          dimension: size,
          child: imageUrl?.trim().isNotEmpty == true
              ? CachedNetworkImage(
                  imageUrl: imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => ColoredBox(
                    color: background,
                    child: const Center(
                      child: SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  ),
                  errorWidget: (_, __, ___) => fallback(),
                )
              : fallback(),
        ),
      ),
    );
  }
}
