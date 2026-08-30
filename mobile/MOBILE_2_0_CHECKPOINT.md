# CollabResearch Mobile 2.0 — checkpoint de conclusão

Data da retomada: 2026-08-30.

Este checkpoint substitui o registro de interrupção anterior. A retomada foi concluída mantendo as alterações restritas a `mobile/`.

## Entregue

- Agenda, Entregas e Avaliações conectadas ao GoRouter, aos projetos, ao dashboard e ao perfil.
- Fluxos de avaliação do aluno e do orientador, incluindo ciência, edição antes da ciência, notas e comentários.
- Orientandos, detalhe do orientando, perfil de terceiros e conversa privada.
- Documentos próprios e públicos, com exclusão, abertura externa e separação de estado entre perfis.
- Dashboard acadêmico específico para aluno e orientador.
- Reenvio, revisão e download de versões de entregas com regras de autorização e validação.
- Estado e confirmações de inscrições/orientações.
- Redesign responsivo de cards de projeto, notificações e componentes acadêmicos.
- Proteções contra overflow em 320 px e escala de texto ampliada.
- Testes de endpoints, parsing, regras acadêmicas e widgets responsivos.

## Verificação deste checkpoint

- `dart analyze lib test`: sem problemas.
- `flutter test --no-pub`: 51 testes aprovados.
- `flutter build web --no-pub`: concluído; artefatos em `build/web`.
- Build Android não executado porque o ambiente não possui Android SDK.

## Limitações externas conhecidas

- O backend não oferece upload binário de documentos. A versão web envia o arquivo diretamente ao Supabase e só depois registra a URL; por isso o mobile informa essa indisponibilidade em vez de simular um upload incompleto.
- Downloads de entregas que retornam redirecionamento/URL assinada são abertos externamente. Uma resposta local direta (`200` com o binário) ainda exige uma estratégia de armazenamento local específica por plataforma.
- O build web emite avisos de Wasm para `flutter_secure_storage_web` e de fonte Cupertino, sem impedir o build JavaScript atual.

## Próxima ação segura

Revisar o diff, criar um commit desta retomada e fazer push somente quando autorizado pelo usuário.
