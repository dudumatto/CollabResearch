# Codex Agents - CollabResearch

Este diretorio concentra agentes, skills e regras locais para trabalhar no CollabResearch.

## Estrutura Centralizada

- .agents/agents/: agentes especializados por area do projeto (formato MD).
- .agents/skills/: skills de design, image-generation e UI (originais).
- .skills/: skills de engenharia (playwright, electron, vercel-react, supabase, etc.).
- .rules/: regras globais de seguranca e qualidade.

## Agentes

Use o agente mais especifico para a tarefa. Quando a tarefa cruzar contratos entre projetos, comece pelo planner.

- planner: planejamento somente leitura para funcionalidades, bugs e mudancas cross-project.
- web_engineer: implementacao na pasta web com React, Vite e Tailwind.
- next_engineer: implementacao em projetos Next.js, especialmente nextweb.
- desktop_engineer: implementacao na pasta desktop com Electron e React.
- flutter_engineer: implementacao na pasta mobile com Flutter/Dart.
- backend_engineer: implementacao na pasta backend com Java, Spring Boot, REST, JPA e PostgreSQL.
- qa_reviewer: revisao somente leitura para bugs, regressoes, riscos e testes ausentes.
- playwright_e2e: especialista em testes E2E de interface com Playwright.
- visual-designer: direcao visual antes de implementar UI relevante.
- ui-reviewer: revisao visual depois de implementar UI.

## Roteamento Recomendado

- Mudanca simples em uma area: use o agente da area.
- Mudanca que afeta API, banco ou mais de um cliente: planner primeiro, depois o agente executor.
- Mudanca visual relevante: planner ou agente da area, visual-designer, implementacao, ui-reviewer, qa_reviewer.
- Bug ou falha de teste: agente da area + systematic-debugging; depois verification-before-completion.
- Revisao antes de entregar: qa_reviewer e, se houver UI, ui-reviewer.

## Skills

Carregue skills por necessidade, nao por habito. Use o menor conjunto que cobre a tarefa.

De .agents/skills/: brandkit, design-taste-frontend, gpt-taste, high-end-visual-design, image-to-code, imagegen-frontend-mobile, imagegen-frontend-web, industrial-brutalist-ui, minimalist-ui, playwright-e2e, playwright-performance, redesign-existing-projects, stitch-design-taste.

De .skills/: electron-best-practices, executing-plans, frontend-design, playwright-best-practices, supabase-postgres-best-practices, systematic-debugging, ui-reviewer, vercel-react-best-practices, verification-before-completion, visual-designer, writing-plans.

## Rules

- anti-ai-ui.md: regra obrigatoria para tarefas de frontend com impacto visual.
- safety.rules: regras de confirmacao para comandos perigosos ou irreversiveis.

## Diretrizes De Trabalho

- Leia o codigo existente antes de editar.
- Preserve padroes locais de arquitetura, nomes, componentes, servicos, hooks, rotas, DTOs e entidades.
- Nao faca reescritas grandes quando uma alteracao localizada resolver.
- Nao adicione dependencias sem necessidade clara e justificativa.
- Nao altere contratos entre frontend, desktop, mobile, backend e banco sem mapear impacto.
- Nao exponha secrets, tokens ou variaveis sensiveis ao frontend ou renderer Electron.
- Nao faca commit, merge, push, reset destrutivo ou clean sem autorizacao explicita.

## UI E Produto

Para qualquer tarefa com impacto visual:

1. Entenda o fluxo real e o publico da tela.
2. Use visual-designer antes de implementar quando houver criacao ou redesenho relevante.
3. Aplique anti-ai-ui.md.
4. Reutilize tokens, componentes, icones e padroes existentes.
5. Garanta estados reais: loading, empty, error, disabled, hover, focus e success quando aplicavel.
6. Revise com ui-reviewer antes de concluir.

## Checklist Antes Da Entrega

- O agente correto foi usado ou o plano explicou por que outro caminho foi necessario.
- Skills relevantes foram carregadas quando aplicavel.
- Rules locais foram respeitadas.
- Arquivos alterados foram listados.
- Comportamento alterado foi explicado.
- Contratos, endpoints, IPC, banco, env vars ou permissoes afetadas foram informados.
- Lint, testes e build relevantes foram executados ou a impossibilidade foi reportada claramente.
- Falhas reais nao foram escondidas.
