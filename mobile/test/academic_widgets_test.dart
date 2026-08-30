import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/widgets/academic/academic_widgets.dart';

void main() {
  testWidgets('action tile apresenta conteudo e responde ao toque',
      (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AcademicActionTile(
            icon: Icons.event_note_outlined,
            title: 'Agenda',
            description: 'Etapas e prazos.',
            badge: 'AGUARDANDO_CIENCIA',
            onTap: () => tapped = true,
          ),
        ),
      ),
    );

    expect(find.text('Agenda'), findsOneWidget);
    expect(find.text('Etapas e prazos.'), findsOneWidget);
    expect(find.text('AGUARDANDO CIÊNCIA'), findsOneWidget);
    await tester.tap(find.text('Agenda'));
    expect(tapped, isTrue);
  });

  testWidgets('action tile nao transborda em 320 px com fonte ampliada',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 568));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(320, 568),
          textScaler: TextScaler.linear(1.5),
        ),
        child: MaterialApp(
          home: Scaffold(
            body: AcademicActionTile(
              icon: Icons.fact_check_outlined,
              title: 'Avaliações acadêmicas',
              description: 'Notas e comentários por etapa concluída.',
              badge: 'AGUARDANDO_CIENCIA',
              onTap: () {},
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('AGUARDANDO CIÊNCIA'), findsOneWidget);
  });

  testWidgets('badge traduz ajustes solicitados pelo backend', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: AcademicStatusBadge('CHANGES_REQUESTED')),
      ),
    );

    expect(find.text('AJUSTES SOLICITADOS'), findsOneWidget);
  });
}
