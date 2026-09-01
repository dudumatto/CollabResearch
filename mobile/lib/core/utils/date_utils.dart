import 'package:timeago/timeago.dart' as timeago;

class DateUtilsX {
  static bool _localeRegistered = false;

  static const List<String> _shortWeekdays = [
    'seg',
    'ter',
    'qua',
    'qui',
    'sex',
    'sáb',
    'dom',
  ];

  static String relative(DateTime value) {
    _ensureLocaleRegistered();
    return timeago.format(value, locale: 'pt_BR');
  }

  /// Horario curto para a lista de conversas: hora no mesmo dia, "Ontem" no
  /// dia anterior, dia da semana na ultima semana e data curta acima disso.
  /// Formatado a mao para nao depender de `initializeDateFormatting`.
  static String conversationTimestamp(DateTime value, {DateTime? now}) {
    final local = value.toLocal();
    final reference = (now ?? DateTime.now()).toLocal();
    final today = DateTime(reference.year, reference.month, reference.day);
    final day = DateTime(local.year, local.month, local.day);
    final daysApart = today.difference(day).inDays;

    if (daysApart <= 0) {
      return '${_two(local.hour)}:${_two(local.minute)}';
    }
    if (daysApart == 1) return 'Ontem';
    if (daysApart < 7) return _shortWeekdays[local.weekday - 1];
    return '${_two(local.day)}/${_two(local.month)}/${_two(local.year % 100)}';
  }

  /// Mesmo dia do calendário, comparado em horário local.
  static bool isSameDay(DateTime? a, DateTime? b) {
    if (a == null || b == null) return false;
    final localA = a.toLocal();
    final localB = b.toLocal();
    return localA.year == localB.year &&
        localA.month == localB.month &&
        localA.day == localB.day;
  }

  /// Diferença em dias inteiros, normalizada por data: negativo no passado,
  /// 0 hoje, positivo no futuro. Fonte única para prazo atrasado, "vence em X
  /// dias" e a escala de urgência da agenda.
  static int daysUntil(DateTime target, {DateTime? now}) {
    final reference = (now ?? DateTime.now()).toLocal();
    final today = DateTime(reference.year, reference.month, reference.day);
    final local = target.toLocal();
    final day = DateTime(local.year, local.month, local.day);
    return day.difference(today).inDays;
  }

  /// Rótulo de agrupamento por dia, usado nos cabeçalhos das notificações.
  static String dayBucketLabel(DateTime value, {DateTime? now}) {
    final difference = daysUntil(value, now: now);
    if (difference == 0) return 'Hoje';
    if (difference == -1) return 'Ontem';
    if (difference == 1) return 'Amanhã';
    if (difference < 0 && difference > -7) return 'Esta semana';
    return shortDate(value);
  }

  static String shortDate(DateTime value) {
    final local = value.toLocal();
    return '${_two(local.day)}/${_two(local.month)}/${local.year}';
  }

  /// "14 de setembro"
  static String longDate(DateTime value) {
    final local = value.toLocal();
    return '${local.day} de ${monthName(local.month).toLowerCase()}';
  }

  // Tabelas à mão de propósito: DateFormat com locale 'pt_BR' lança
  // LocaleDataException sem initializeDateFormatting, e chamar isso no main e
  // no setup de todo teste de widget é mudança de estado global por umas
  // poucas linhas de string. Não trocar por intl.
  static const List<String> _monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  static const List<String> _weekdayNames = [
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
    'domingo',
  ];

  static String monthName(int month) => _monthNames[(month - 1) % 12];

  static String monthAbbrev(int month) =>
      _monthNames[(month - 1) % 12].substring(0, 3).toUpperCase();

  /// [weekday] no padrão do Dart: 1 = segunda ... 7 = domingo.
  static String weekdayName(int weekday) => _weekdayNames[(weekday - 1) % 7];

  static String _two(int value) => value.toString().padLeft(2, '0');

  static bool _ensureLocaleRegistered() {
    if (!_localeRegistered) {
      timeago.setLocaleMessages('pt_BR', timeago.PtBrMessages());
      _localeRegistered = true;
    }
    return true;
  }
}
