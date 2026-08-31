// Gerador dos icones da marca.
//
// Nao e um teste de regressao: e uma ferramenta, rodada sob o harness de
// widget test apenas porque precisa de um pipeline de renderizacao para
// rasterizar o SVG. Fica fora de test/ de proposito, para nao entrar no
// `flutter test` do dia a dia.
//
// Uso:
//   flutter test tool/generate_brand_icons.dart
//
// Fonte: assets/brand/logo-icon.svg (unica cor, #1F7A5A).

import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';

const _brandGreen = Color(0xFF1F7A5A);
const _brandGreenDark = Color(0xFF185E46);

/// Um arquivo a gerar.
class _IconSpec {
  const _IconSpec({
    required this.path,
    required this.size,
    this.background,
    this.markRatio = 0.58,
  });

  final String path;
  final int size;

  /// Nulo gera fundo transparente (usado no foreground adaptativo).
  final Color? background;

  /// Quanto da tela a marca ocupa. Menor em icone mascaravel, para a marca
  /// nao ser cortada quando o sistema aplica um recorte circular.
  final double markRatio;
}

const _androidLegacy = <String, int>{
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

// Icone adaptativo: tela de 108dp com zona segura central de 66dp.
const _androidAdaptive = <String, int>{
  'mdpi': 108,
  'hdpi': 162,
  'xhdpi': 216,
  'xxhdpi': 324,
  'xxxhdpi': 432,
};

void main() {
  testWidgets('gera os icones da marca', (tester) async {
    final source = File('assets/brand/logo-icon.svg').readAsStringSync();
    // A marca vira branca sobre o verde: em tamanho pequeno o contraste
    // funciona melhor do que verde sobre branco.
    final whiteMark = source.replaceAll('#1F7A5A', '#FFFFFF');

    final specs = <_IconSpec>[
      for (final entry in _androidLegacy.entries)
        _IconSpec(
          path: 'android/app/src/main/res/mipmap-${entry.key}/ic_launcher.png',
          size: entry.value,
          background: _brandGreen,
        ),
      for (final entry in _androidAdaptive.entries)
        _IconSpec(
          path: 'android/app/src/main/res/mipmap-${entry.key}'
              '/ic_launcher_foreground.png',
          size: entry.value,
          markRatio: 0.42,
        ),
      const _IconSpec(
        path: 'web/icons/Icon-192.png',
        size: 192,
        background: _brandGreen,
      ),
      const _IconSpec(
        path: 'web/icons/Icon-512.png',
        size: 512,
        background: _brandGreen,
      ),
      const _IconSpec(
        path: 'web/icons/Icon-maskable-192.png',
        size: 192,
        background: _brandGreen,
        markRatio: 0.42,
      ),
      const _IconSpec(
        path: 'web/icons/Icon-maskable-512.png',
        size: 512,
        background: _brandGreen,
        markRatio: 0.42,
      ),
      const _IconSpec(
        path: 'web/favicon.png',
        size: 64,
        background: _brandGreen,
      ),
    ];

    for (final spec in specs) {
      final key = GlobalKey();
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(),
          child: Directionality(
            textDirection: TextDirection.ltr,
            child: Center(
              child: RepaintBoundary(
                key: key,
                child: Container(
                  width: spec.size.toDouble(),
                  height: spec.size.toDouble(),
                  decoration: BoxDecoration(
                    gradient: spec.background == null
                        ? null
                        : const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [_brandGreen, _brandGreenDark],
                          ),
                  ),
                  alignment: Alignment.center,
                  child: SvgPicture.string(
                    whiteMark,
                    width: spec.size * spec.markRatio,
                    height: spec.size * spec.markRatio,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      late Uint8List bytes;
      await tester.runAsync(() async {
        final boundary =
            key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
        final image = await boundary.toImage();
        final data = await image.toByteData(format: ui.ImageByteFormat.png);
        bytes = data!.buffer.asUint8List();
        image.dispose();
      });

      final file = File(spec.path);
      file.parent.createSync(recursive: true);
      file.writeAsBytesSync(bytes);
      debugPrint('gerado ${spec.path} (${spec.size}px, ${bytes.length} bytes)');
    }
  });
}
