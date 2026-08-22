import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class CollabLogo extends StatelessWidget {
  const CollabLogo({
    super.key,
    this.full = true,
    this.height = 28,
    this.inverted = false,
  });

  final bool full;
  final double height;
  final bool inverted;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      full
          ? 'assets/brand/logo-full.svg'
          : 'assets/brand/logo-icon.svg',
      height: height,
      colorFilter: inverted
          ? const ColorFilter.mode(Colors.white, BlendMode.srcIn)
          : null,
      semanticsLabel: full ? 'CollabResearch' : null,
    );
  }
}
