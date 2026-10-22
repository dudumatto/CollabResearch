import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/lumen_recommendation.dart';
import 'package:tcc_mobile/models/subscription.dart';

void main() {
  test('Subscription le avaliacao da Lumen serializada como string JSON', () {
    final s = Subscription.fromJson({
      'id': 1,
      'status': 'PENDENTE',
      'projetoId': 2,
      'projetoTitulo': 'P',
      'lumenPontuacao': 8,
      'lumenJustificativa': 'Boa aderência',
      'lumenAvaliacao': '{"notaFinal":7.6,"confianca":"alto"}',
    });
    expect(s.lumenScore, 8);
    expect(s.lumenDisplayScore, 7.6);
    expect(s.lumenEvaluation?['confianca'], 'alto');
  });

  test('Subscription sem Lumen e withLumen preserva dados', () {
    final s = Subscription.fromJson({'id': 1, 'status': 'PENDENTE'});
    expect(s.lumenScore, isNull);
    final scored = s.withLumen(score: 5, justification: 'ok');
    expect(scored.lumenDisplayScore, 5);
    expect(scored.id, '1');
  });

  test('LumenCandidate.fromJson', () {
    final c = LumenCandidate.fromJson({
      'inscricaoId': 3,
      'pontuacao': 9,
      'justificativa': 'j',
      'avaliacao': {'notaFinal': 9.2},
    });
    expect(c.subscriptionId, '3');
    expect(c.score, 9);
    expect(c.evaluation?['notaFinal'], 9.2);
  });
}
