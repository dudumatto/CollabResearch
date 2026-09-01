import '../../models/user.dart';

/// Identidade da sessao usada como chave do MultiProvider em [TccMobileApp].
/// Quando ela muda, os sete providers sao destruidos e recriados -- o que e o
/// comportamento desejado ao trocar de conta, para nao vazar dados de um
/// usuario para outro.
///
/// Nao pode ser o id: o token nao carrega id (JwtService assina com
/// `.subject(usuario.getEmail())`), entao ele so chega em refreshProfile().
/// Usar o id fazia a chave mudar duas vezes num unico login
/// (guest -> sem id -> id real), jogando fora tudo que os providers ja tinham
/// carregado e devolvendo as telas ao estado vazio no meio do caminho.
///
/// O e-mail vem do subject do token e ja esta correto no primeiro frame apos
/// o login, entao a chave muda uma vez so.
String sessionKeyFor(User? user) {
  if (user == null) return 'guest';

  if (user.email.isNotEmpty) return 'email:${user.email}';
  if (user.id.isNotEmpty) return 'id:${user.id}';
  return 'guest';
}
