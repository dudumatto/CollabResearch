# Codex Agents — CollabResearch

## Estrutura

- `.agents/agents/` — agentes especializados por módulo.
- `.agents/skills/` — única localização de skills do repositório.
- `.rules/` — `anti-ai-ui.md` (UI) e `safety.rules` (confirmações de comandos perigosos).

## Agentes

Use o agente mais específico; para mudanças que cruzam contratos, comece pelo planner.

- `planner` — planejamento somente leitura, mudanças cross-project.
- `backend_engineer` — `backend/` (Java, Spring Boot, REST, JPA, PostgreSQL).
- `web_engineer` — `web/` (React, Vite, Tailwind).
- `next_engineer` — `nextweb/` (Next.js).
- `desktop_engineer` — `desktop/` (Electron + React).
- `flutter_engineer` — `mobile/` (Flutter/Dart).
- `qa_reviewer` — revisão somente leitura: bugs, regressões, riscos, testes ausentes.
- `playwright_e2e` — testes E2E com Playwright.
- `visual-designer` — direção visual antes de implementar UI relevante.
- `ui-reviewer` — revisão visual após implementar UI.

## Skills (`.agents/skills/`)

- `systematic-debugging` — bugs e falhas de teste: causa raiz antes de corrigir.
- `verification-before-completion` — evidência (testes/build) antes de declarar concluído.
- `vercel-react-best-practices` — performance em React/Next.js.
- `electron-best-practices` — segurança, IPC tipado, empacotamento Electron.
- `playwright-best-practices` / `playwright-e2e` — testes E2E.
- `supabase-postgres-best-practices` — queries, schema e performance Postgres.
- `design-taste-frontend` — direção de design para landing/login/cadastro/institucional e redesigns.
- `redesign-existing-projects` — elevar qualidade visual de telas existentes sem quebrar funcionalidade.
- `caveman` — modo de resposta conciso (lite é o padrão via `.codex/hooks.json`).

Carregue skills por necessidade, não por hábito. Para dashboard e componentes existentes, respeite primeiro o design system do próprio módulo.

## Roteamento

- Mudança em um módulo: agente do módulo.
- Mudança em API, banco ou mais de um cliente: planner primeiro.
- UI relevante: visual-designer → implementação → ui-reviewer.
- Bug: agente do módulo + systematic-debugging; feche com verification-before-completion.
- Antes de entregar: qa_reviewer (e ui-reviewer se houver UI).

## Checklist de entrega

- Lint, testes e build do módulo executados (ou impossibilidade reportada).
- Contratos afetados (endpoints, IPC, banco, env vars) informados.
- Falhas reais não escondidas.
