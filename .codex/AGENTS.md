# Codex Agents - CollabResearch

Este diretório concentra agentes, skills e regras locais para trabalhar no CollabResearch com mudanças pequenas, verificáveis e coerentes entre frontend, desktop, mobile, backend e banco.

## Estrutura

- `.codex/agents`: agentes especializados por área do projeto.
- `.codex/skills`: skills locais que devem ser carregadas quando a tarefa combinar com o escopo.
- `.codex/rules`: regras de segurança e qualidade aplicáveis ao trabalho no repositório.

## Agentes

Use o agente mais específico para a tarefa. Quando a tarefa cruzar contratos entre projetos, comece pelo `planner`.

- `planner`: planejamento somente leitura para funcionalidades, bugs e mudanças cross-project. Mapeia fluxo atual, arquivos, símbolos, riscos, dependências e comandos de teste. Não implementa.
- `web_engineer`: implementação na pasta `web` com React, Vite e Tailwind. Use para telas, componentes, hooks, serviços e estilos do frontend web.
- `next_engineer`: implementação em projetos Next.js, especialmente `nextweb`. Use para App Router/Pages Router, Server/Client Components, rotas, layouts, cache e integração full-stack.
- `desktop_engineer`: implementação na pasta `desktop` com Electron e React. Use para main process, preload, renderer, IPC, contextBridge e build desktop.
- `flutter_engineer`: implementação na pasta `mobile` com Flutter/Dart. Use para telas mobile, estado, serviços, APIs, responsividade, permissões e testes Flutter.
- `backend_engineer`: implementação na pasta `backend` com Java, Spring Boot, REST, JPA e PostgreSQL. Use para controllers, services, repositories, entidades, DTOs, autenticação, autorização e persistência.
- `qa_reviewer`: revisão somente leitura para bugs, regressões, riscos, contratos quebrados e testes ausentes. Não implementa.

### Roteamento Recomendado

- Mudança simples em uma área: use o agente da área.
- Mudança que afeta API, banco ou mais de um cliente: `planner` primeiro, depois o agente executor.
- Mudança visual relevante: `planner` ou agente da área -> `visual-designer` -> implementação -> `ui-reviewer` -> `qa_reviewer`.
- Bug ou falha de teste: agente da área + `systematic-debugging`; depois `verification-before-completion`.
- Revisão antes de entregar: `qa_reviewer` e, se houver UI, `ui-reviewer`.

## Skills Locais

Carregue skills por necessidade, não por hábito. Use o menor conjunto que cobre a tarefa.

- `visual-designer`: cria direção visual antes da implementação quando houver nova tela, redesenho, UX, layout, tokens, responsividade ou design system.
- `ui-reviewer`: revisa UI implementada e bloqueia entregas visuais fracas, genéricas, desalinhadas, inacessíveis ou inconsistentes.
- `frontend-design`: guia para decisões visuais distintas e intencionais ao criar ou remodelar interfaces.
- `vercel-react-best-practices`: boas práticas de performance para React/Next.js, componentes, data fetching, bundle e renderização.
- `electron-best-practices`: boas práticas de Electron com React, segurança, contextBridge, IPC tipado, empacotamento e testes.
- `playwright-best-practices`: boas práticas para testes Playwright E2E, componentes, API, acessibilidade, visual regression, mobile, Electron e CI.
- `systematic-debugging`: use antes de corrigir bugs ou falhas; exige investigação de causa raiz antes de aplicar patch.
- `verification-before-completion`: use antes de afirmar que algo está pronto; exige evidência por lint, testes, build ou validação equivalente.
- `writing-plans`: use para escrever plano de implementação em tarefas multi-etapa antes de tocar código.
- `executing-plans`: use quando já existe um plano escrito e a tarefa é executá-lo com checkpoints.
- `supabase-postgres-best-practices`: use ao escrever, revisar ou otimizar SQL, schemas, índices, queries ou comportamento PostgreSQL.

Observação: `.codex/skills/.agents` é uma cópia de origem/importação das skills baixadas. Prefira as skills de primeiro nível em `.codex/skills/<nome>`.

## Rules Locais

- `anti-ai-ui.md`: regra obrigatória para tarefas de frontend com impacto visual. A interface deve parecer produto real, específica para o CollabResearch, responsiva e útil.
- `safety.rules`: regras de confirmação para comandos perigosos ou irreversíveis, especialmente `git push`, `git reset --hard`, `git clean` e exclusão forçada de branch.

## Diretrizes De Trabalho

- Leia o código existente antes de editar.
- Preserve padrões locais de arquitetura, nomes, componentes, serviços, hooks, rotas, DTOs e entidades.
- Não faça reescritas grandes quando uma alteração localizada resolver.
- Não adicione dependências sem necessidade clara e justificativa.
- Não altere contratos entre frontend, desktop, mobile, backend e banco sem mapear impacto.
- Não exponha secrets, tokens ou variáveis sensíveis ao frontend ou renderer Electron.
- Não faça commit, merge, push, reset destrutivo ou clean sem autorização explícita.

## UI E Produto

Para qualquer tarefa com impacto visual:

1. Entenda o fluxo real e o público da tela.
2. Use `visual-designer` antes de implementar quando houver criação ou redesenho relevante.
3. Aplique `anti-ai-ui.md`.
4. Reutilize tokens, componentes, ícones e padrões existentes.
5. Garanta estados reais: loading, empty, error, disabled, hover, focus e success quando aplicável.
6. Revise com `ui-reviewer` antes de concluir.

Evite:

- cards dentro de cards;
- gradientes genéricos como identidade principal;
- espaçamento gigante sem função;
- hero/landing page para telas operacionais;
- copy vaga;
- efeitos pesados sem necessidade do produto.

## Checklist Antes Da Entrega

- O agente correto foi usado ou o plano explicou por que outro caminho foi necessário.
- Skills relevantes foram carregadas quando aplicável.
- Rules locais foram respeitadas.
- Arquivos alterados foram listados.
- Comportamento alterado foi explicado.
- Contratos, endpoints, IPC, banco, env vars ou permissões afetadas foram informados.
- Lint, testes e build relevantes foram executados ou a impossibilidade foi reportada claramente.
- Falhas reais não foram escondidas.
