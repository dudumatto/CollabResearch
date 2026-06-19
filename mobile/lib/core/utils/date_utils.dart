import 'package:timeago/timeago.dart' as timeago;

class DateUtilsX {
  static bool _localeRegistered = false;

  static String relative(DateTime value) {
    _ensureLocaleRegistered();
    return timeago.format(value, locale: 'pt_BR');
  }

  static bool _ensureLocaleRegistered() {
    if (!_localeRegistered) {
      timeago.setLocaleMessages('pt_BR', timeago.PtBrMessages());
      _localeRegistered = true;
    }
    return true;
  }
}
