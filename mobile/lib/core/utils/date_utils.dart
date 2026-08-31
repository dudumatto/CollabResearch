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

  static String _two(int value) => value.toString().padLeft(2, '0');

  static bool _ensureLocaleRegistered() {
    if (!_localeRegistered) {
      timeago.setLocaleMessages('pt_BR', timeago.PtBrMessages());
      _localeRegistered = true;
    }
    return true;
  }
}
