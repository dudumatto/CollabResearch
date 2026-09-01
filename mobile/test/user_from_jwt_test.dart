import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/user.dart';

void main() {
  group('User.fromJwtPayload', () {
    // Payload real emitido por JwtService.generateToken: o subject e o e-mail
    // do usuario e nao ha claim de id.
    Map<String, dynamic> backendPayload() => <String, dynamic>{
          'jti': '6f1c9a2e-0d3b-4f52-9a77-1b2c3d4e5f60',
          'sub': 'aluno@universidade.br',
          'tipo': 'ALUNO',
          'iat': 1758000000,
          'exp': 1758003600,
        };

    test('nao usa o subject como id', () {
      final user = User.fromJwtPayload(backendPayload());

      expect(user.id, isEmpty,
          reason: 'o token nao carrega id; ele so chega em /usuarios/me');
      expect(user.id, isNot(contains('@')));
    });

    test('le o e-mail do subject', () {
      final user = User.fromJwtPayload(backendPayload());

      expect(user.email, 'aluno@universidade.br');
    });

    test('mantem o tipo do usuario', () {
      final user = User.fromJwtPayload(backendPayload());

      expect(user.type, 'ALUNO');
    });

    test('usa o claim id quando ele existir', () {
      final user = User.fromJwtPayload(<String, dynamic>{
        ...backendPayload(),
        'id': '42',
      });

      expect(user.id, '42');
      expect(user.email, 'aluno@universidade.br');
    });

    test('aceita subject que nao e e-mail como id', () {
      final user = User.fromJwtPayload(<String, dynamic>{
        ...backendPayload(),
        'sub': '42',
      });

      expect(user.id, '42');
      expect(user.email, isEmpty);
    });
  });
}
