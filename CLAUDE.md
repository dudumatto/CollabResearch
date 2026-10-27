# CollabResearch instructions for Claude Code

## Context first

- Treat `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` as the primary architecture index for this repository.
- Before broad source exploration, query or inspect the graph with `graphify query`, `graphify explain`, or `graphify path`.
- Read source files only for the specific nodes, paths, and contracts needed for the task. Do not scan the whole repository when the graph can answer the question.
- Refresh the graph with `graphify . --code-only` after substantial structural changes.

## Defaults

- Ponytail, Caveman e RTK vêm do global (`~/.claude`); não repetir aqui. Subagentes não herdam o estilo: os agentes de implementação carregam a linha "Estilo".
- O hook do RTK só atua em Bash. Read, Grep e Glob não passam por ele; a economia de tokens nelas depende do graphify.

## Módulos

- `backend/tcc-backend` — Java 21 / Spring Boot / PostgreSQL (Flyway), `./mvnw test`
- `web/` — React 18 / Vite / Tailwind, `npm run lint|build --prefix web`
- `desktop/` — Electron + React, `npm run build --prefix desktop`
- `mobile/` — Flutter/Dart, `flutter analyze` e `flutter test`

Regras: identifique o módulo afetado; leia o código antes de editar; mudanças localizadas; não altere contratos entre clientes, API ou banco sem mapear o impacto; rode build/lint/testes do módulo e corrija até funcionar; sem commit, push, reset destrutivo ou clean sem autorização explícita. Entrega: lint/testes/build executados (ou impossibilidade reportada), contratos afetados informados, falhas reais não escondidas.

## Agentes (`.claude/agents/`) e roteamento

Skills em `.claude/skills/`; regra de UI em `.rules/anti-ai-ui.md`. Carregue só o necessário.

| Agente | Modelo | Uso |
|---|---|---|
| `arquiteto` | opus | plano cross-módulo, cria o contexto da tarefa |
| `backend-engineer` `web-engineer` `desktop-engineer` `flutter-engineer` | sonnet | implementação no módulo |
| `bugfix` | opus | bug de causa raiz difícil (bug comum: engenheiro do módulo) |
| `qa-reviewer` `release-engineer` `ui-reviewer` `playwright-e2e` | sonnet | revisão, release, UI, E2E |
| `security-reviewer` | opus | auth/JWT/permissões/secrets/IPC + triagem do `semgrep-report.json` |
| `visual-designer` | opus | direção visual antes de UI relevante |
| `grafo` | haiku | `graphify update .` e registro no contexto |

Roteamento: um módulo → engenheiro dele; API/banco/vários clientes → `arquiteto` primeiro; auth/secrets/dependências → `security-reviewer` depois; UI relevante → `visual-designer` → engenheiro → `ui-reviewer`; antes de entregar → `qa-reviewer`.

## Contexto compartilhado de tarefa (vale para o agente principal e todos os agentes)

Este é o protocolo único; os agentes em `.claude/agents/` apenas o referenciam.

- Cada tarefa tem `.claude/context/<tarefa-slug>.md` (modelo: `_TEMPLATE.md`; conteúdo ignorado pelo git). O slug vem do agente pai. O primeiro agente a atuar cria o arquivo a partir do modelo.
- **Antes de agir:** ler esse arquivo e consultar o grafo (`graphify query|path|explain`) antes de buscar no código.
- **Ao terminar:** acrescentar seção `### <agente> — <data>` (fez, arquivos, decisões/riscos, falta) e atualizar a tabela de status. Nunca apagar nem reescrever o trabalho dos outros. Resumos, sem código colado.
- **Grafo:** quem alterar código roda `graphify update .` ao finalizar (ou delega ao `grafo`; leva ~2 min, prefira rodar em background) e registra "grafo: atualizado" ou o erro no contexto. Falha não trava a tarefa.
- **Somente leitura:** `arquiteto`, `qa-reviewer`, `security-reviewer`, `ui-reviewer`, `release-engineer` e `visual-designer` só escrevem em `.claude/context/` (imposto por `.claude/hooks/context-only.js`).
- Sem commit, merge ou push sem autorização explícita.

## Security

- Never include secrets, tokens, or credentials in source, generated graph files, frontend code, mobile code, or Electron renderer code.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
