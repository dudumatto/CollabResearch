import 'dart:convert';

class JwtDecoder {
  static Map<String, dynamic> decodePayload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      throw const FormatException('JWT invalido');
    }
    final payload = _decodeBase64(parts[1]);
    final decoded = jsonDecode(payload);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return <String, dynamic>{};
  }

  static DateTime? expirationFromToken(String token) {
    final payload = decodePayload(token);
    final exp = payload['exp'];
    if (exp is int) {
      return DateTime.fromMillisecondsSinceEpoch(exp * 1000);
    }
    if (exp is String) {
      final parsed = int.tryParse(exp);
      if (parsed != null) {
        return DateTime.fromMillisecondsSinceEpoch(parsed * 1000);
      }
    }
    return null;
  }

  static bool isExpired(String token) {
    try {
      final expiration = expirationFromToken(token);
      if (expiration == null) return false;
      return DateTime.now().isAfter(expiration);
    } on FormatException {
      return true;
    } catch (_) {
      return true;
    }
  }

  static String _decodeBase64(String input) {
    final normalized = base64Url.normalize(input);
    return utf8.decode(base64Url.decode(normalized));
  }
}
