import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/utils/date_utils.dart';

void main() {
  group('isSameDay', () {
    test('mesmo dia com horas diferentes', () {
      expect(
        DateUtilsX.isSameDay(
          DateTime(2026, 8, 31, 0, 1),
          DateTime(2026, 8, 31, 23, 59),
        ),
        isTrue,
      );
    });

    test('dias vizinhos nao sao o mesmo dia', () {
      expect(
        DateUtilsX.isSameDay(
          DateTime(2026, 8, 31, 23, 59),
          DateTime(2026, 9, 1, 0, 1),
        ),
        isFalse,
      );
    });

    test('nulo nunca casa', () {
      expect(DateUtilsX.isSameDay(null, DateTime(2026, 8, 31)), isFalse);
      expect(DateUtilsX.isSameDay(DateTime(2026, 8, 31), null), isFalse);
      expect(DateUtilsX.isSameDay(null, null), isFalse);
    });

    test('compara em horario local, nao em UTC', () {
      final local = DateTime(2026, 8, 31, 12);
      expect(DateUtilsX.isSameDay(local.toUtc(), local), isTrue);
    });
  });

  group('daysUntil', () {
    final now = DateTime(2026, 8, 31, 15, 30);

    test('mesmo dia da zero, mesmo mais cedo', () {
      expect(DateUtilsX.daysUntil(DateTime(2026, 8, 31, 0, 1), now: now), 0);
      expect(DateUtilsX.daysUntil(DateTime(2026, 8, 31, 23, 59), now: now), 0);
    });

    test('ontem e -1, amanha e 1', () {
      expect(DateUtilsX.daysUntil(DateTime(2026, 8, 30, 23), now: now), -1);
      expect(DateUtilsX.daysUntil(DateTime(2026, 9, 1, 1), now: now), 1);
    });

    test('atravessa a virada do mes', () {
      expect(DateUtilsX.daysUntil(DateTime(2026, 9, 7), now: now), 7);
      expect(DateUtilsX.daysUntil(DateTime(2026, 8, 24), now: now), -7);
    });
  });

  group('dayBucketLabel', () {
    final now = DateTime(2026, 8, 31, 15, 30);

    test('hoje, ontem e amanha', () {
      expect(DateUtilsX.dayBucketLabel(DateTime(2026, 8, 31, 9), now: now),
          'Hoje');
      expect(DateUtilsX.dayBucketLabel(DateTime(2026, 8, 30), now: now),
          'Ontem');
      expect(DateUtilsX.dayBucketLabel(DateTime(2026, 9, 1), now: now),
          'Amanhã');
    });

    test('dentro da ultima semana agrupa como Esta semana', () {
      expect(DateUtilsX.dayBucketLabel(DateTime(2026, 8, 27), now: now),
          'Esta semana');
    });

    test('mais de uma semana atras usa a data', () {
      expect(DateUtilsX.dayBucketLabel(DateTime(2026, 8, 20), now: now),
          '20/08/2026');
    });
  });

  group('formatos', () {
    test('shortDate preenche com zero', () {
      expect(DateUtilsX.shortDate(DateTime(2026, 9, 4)), '04/09/2026');
    });

    test('longDate escreve o mes por extenso', () {
      expect(DateUtilsX.longDate(DateTime(2026, 9, 14)), '14 de setembro');
    });

    test('monthName e monthAbbrev', () {
      expect(DateUtilsX.monthName(1), 'Janeiro');
      expect(DateUtilsX.monthName(12), 'Dezembro');
      expect(DateUtilsX.monthAbbrev(9), 'SET');
      expect(DateUtilsX.monthAbbrev(3), 'MAR');
    });

    test('weekdayName segue o padrao do Dart', () {
      expect(DateUtilsX.weekdayName(DateTime.monday), 'segunda-feira');
      expect(DateUtilsX.weekdayName(DateTime.sunday), 'domingo');
      // 2026-09-14 e uma segunda-feira.
      expect(
        DateUtilsX.weekdayName(DateTime(2026, 9, 14).weekday),
        'segunda-feira',
      );
    });
  });
}
