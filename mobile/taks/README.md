# Tasks Mobile

Este diretorio organiza o que falta para aproximar o `tcc-mobile` do planejamento Flutter original e do frontend web.

## Ordem sugerida

1. [02-progresso.md](02-progresso.md)
2. [03-inscricoes.md](03-inscricoes.md)
3. [04-dashboard.md](04-dashboard.md)
4. [05-projetos.md](05-projetos.md)
5. [06-realtime-chat-notificacoes.md](06-realtime-chat-notificacoes.md)
6. [07-perfil-configuracoes.md](07-perfil-configuracoes.md)
7. [08-testes-validacao.md](08-testes-validacao.md)

## Regras gerais

- Preservar as rotas e contratos publicos ja usados pelo app.
- Todo acesso HTTP deve passar pelos services existentes e pelo `ApiClient`.
- Token JWT deve continuar somente no `flutter_secure_storage`.
- Cada task deve terminar com `flutter analyze` e testes focados quando existirem.
- Nao misturar refatoracoes grandes com implementacao de tela.
