import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/animation/app_animations.dart';

Widget _testApp({required bool disableAnimations, required Widget child}) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(disableAnimations: disableAnimations),
      child: Scaffold(body: child),
    ),
  );
}

void main() {
  testWidgets('FadeSlideIn becomes instant when animations are disabled',
      (tester) async {
    await tester.pumpWidget(
      _testApp(
        disableAnimations: true,
        child: const FadeSlideIn(child: Text('Conteudo')),
      ),
    );

    expect(find.text('Conteudo'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byType(FadeSlideIn),
        matching: find.byType(FadeTransition),
      ),
      findsNothing,
    );
    expect(
      find.descendant(
        of: find.byType(FadeSlideIn),
        matching: find.byType(SlideTransition),
      ),
      findsNothing,
    );
  });

  testWidgets('AnimatedPress becomes instant when animations are disabled',
      (tester) async {
    await tester.pumpWidget(
      _testApp(
        disableAnimations: true,
        child: const AnimatedPress(child: Text('Card')),
      ),
    );

    expect(find.text('Card'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byType(AnimatedPress),
        matching: find.byType(AnimatedScale),
      ),
      findsNothing,
    );
  });

  testWidgets('animation primitives are active when motion is allowed',
      (tester) async {
    await tester.pumpWidget(
      _testApp(
        disableAnimations: false,
        child: const Column(
          children: [
            FadeSlideIn(child: Text('Entrada')),
            AnimatedPress(child: Text('Pressao')),
          ],
        ),
      ),
    );

    expect(
      find.descendant(
        of: find.byType(FadeSlideIn),
        matching: find.byType(FadeTransition),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byType(FadeSlideIn),
        matching: find.byType(SlideTransition),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byType(AnimatedPress),
        matching: find.byType(AnimatedScale),
      ),
      findsOneWidget,
    );
  });
}
