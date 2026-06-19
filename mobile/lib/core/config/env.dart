import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static String get apiUrl {
    try {
      return dotenv.env['API_URL'] ?? 'http://localhost:8080';
    } catch (_) {
      return 'http://localhost:8080';
    }
  }
}
