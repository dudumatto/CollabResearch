import 'package:intl/intl.dart';

class Formatters {
  static String currency(num value) => NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$').format(value);
  static String date(DateTime value) => DateFormat('dd/MM/yyyy').format(value);
}

