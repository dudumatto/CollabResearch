import 'package:flutter_test/flutter_test.dart';

import 'package:tcc_mobile/core/auth/jwt_decoder.dart';

void main() {
  test('considera token invalido como expirado', () {
    expect(JwtDecoder.isExpired('token-invalido'), isTrue);
  });
}
