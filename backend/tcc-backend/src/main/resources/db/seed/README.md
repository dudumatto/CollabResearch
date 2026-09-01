# Seeds de desenvolvimento

Este diretorio guarda SQLs para popular ambientes de desenvolvimento, teste ou demonstracao.

## dev_seed.sql

Seed realista para o CollabResearch, gerado para rodar depois das migrations do backend.

Credenciais principais:

- Admin: `admin@collab.com` / `admin123`
- Alunos e orientadores: senha `12345678`
- Exemplo externo solicitado: `eduardo@gmail.com` / `12345678`

Conteudo coberto:

- 11 alunos
- 5 orientadores
- 4 cursos
- 6 areas de pesquisa
- 14 projetos em estados diferentes
- inscricoes pendentes, aprovadas e rejeitadas
- etapas concluidas, pendentes, ativas, rejeitadas e atrasadas
- entregas aguardando revisao, aprovadas e com alteracoes solicitadas
- avaliacoes academicas e ciencias
- feedbacks, conversas, mensagens, notificacoes e documentos

## Uso seguro

Nao execute este seed automaticamente em producao. Primeiro revise o SQL completo e confirme que o banco alvo foi resetado ou esta preparado para receber IDs fixos.

Fluxo sugerido:

1. Rode as migrations do backend no banco alvo.
2. Revise `dev_seed.sql`.
3. Execute o arquivo no SQL Editor do Supabase ou via `psql` apontando para um ambiente de desenvolvimento.
4. Valide login e telas principais com pelo menos um admin, um orientador e um aluno.