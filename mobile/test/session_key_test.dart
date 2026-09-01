import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/auth/session_key.dart';
import 'package:tcc_mobile/models/user.dart';

void main() {
  group('sessionKeyFor', () {
    // Estado logo apos o login: o token so da o e-mail, o id ainda nao chegou.
    const semId = User(id: '', name: '', email: 'aluno@universidade.br');

    // Depois que refreshProfile() responde, com o id real do mesmo usuario.
    const comId =
        User(id: '42', name: 'Aluno', email: 'aluno@universidade.br');

    test('nao muda quando o id chega do /usuarios/me', () {
      expect(sessionKeyFor(comId), sessionKeyFor(semId),
          reason: 'preencher o id nao pode destruir e recriar os providers');
    });

    test('muda ao trocar de conta', () {
      const outro = User(id: '7', name: 'Outro', email: 'outro@universidade.br');

      expect(sessionKeyFor(outro), isNot(sessionKeyFor(comId)),
          reason: 'trocar de conta precisa limpar o estado dos providers');
    });

    test('deslogado usa guest', () {
      expect(sessionKeyFor(null), 'guest');
    });

    test('sai de guest ao entrar', () {
      expect(sessionKeyFor(semId), isNot(sessionKeyFor(null)));
    });

    test('cai no id quando nao ha e-mail', () {
      const soId = User(id: '42', name: '', email: '');

      expect(sessionKeyFor(soId), 'id:42');
    });

    test('usuario sem e-mail e sem id nao se confunde com outro', () {
      const vazio = User(id: '', name: '', email: '');

      expect(sessionKeyFor(vazio), 'guest');
    });
  });
}
