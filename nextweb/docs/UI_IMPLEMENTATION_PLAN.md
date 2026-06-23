# UI Implementation Plan - nextweb

Status: Fase 1 implementada. Fase 2 implementada para navegacao e layout autenticado. Fase 3 implementada para login e cadastro, com correcao complementar de proporcao das telas de autenticacao antes da Fase 5. Fase 4 implementada para DashboardPage e estados de conteudo. Fase 5 implementada para redesign da Landing Page. Fase 6 auditada sem alteracoes adicionais. Fase 7 validacao final concluida.
Escopo visual: 60% SaaS Moderno (Linear + Stripe), 25% claymorphism leve, 15% Bento UI.
Restricoes permanentes: nao alterar backend, APIs, rotas, autenticacao, hooks, servicos, notificacoes, SearchModal, dark mode ou regras de negocio.

## Fase 1 - Fundacao e componentes base [implementada]

Objetivo: consolidar os tokens visuais e criar componentes reutilizaveis sem redesenhar paginas existentes.

Entregas implementadas:

- Tokens semanticos em `src/styles/variaveis.css`.
- Bridge de tokens Tailwind v4 em `src/styles/theme.css`.
- Classes base `.ui-*` em `src/styles/components.css`.
- Helpers de motion/focus em `src/styles/animations.css`.
- Componentes `Button`, `IconButton`, `TextField`, `Card`, `Badge` e `ModalShell` em `src/app/components/ui`.
- Barrel export em `src/app/components/ui/index.js`.

## Fase 2 - Navegacao e layout autenticado [implementada]

Objetivo: redesenhar Sidebar, Topbar e DashboardLayout usando a fundacao da Fase 1, preservando rotas, links, autenticacao, busca, notificacoes e dados.

Entregas implementadas:

- `Sidebar.jsx`: navegacao agrupada por objetivo, labels corrigidos, resumo de perfil, `IconButton` para recolher menu e `Badge` para contador de notificacoes.
- `Sidebar.css`: superficie clara aquecida, bordas sutis, active state Linear-like, tooltip para modo recolhido, drawer mobile expandido e foco visivel.
- `Topbar.jsx`: `IconButton` para menu/notificacoes, `Badge` para contador, aria-labels melhores e dropdown com `role="menu"` sem alterar logout ou eventos.
- `Topbar.css`: comando de busca mais refinado, perfil compacto, dropdown com superficie clay leve e estados hover/focus consistentes.
- `DashboardLayout.jsx`: textos do shell autenticado corrigidos e `main` com label acessivel, mantendo as mesmas rotas e animacao.
- `DashboardLayout.css`: fundo de app e espacamento do shell alinhados aos tokens da Fase 1, preservando responsividade.

Nao foi alterado nesta fase:

- Nenhuma rota ou link existente.
- Nenhuma pagina (`DashboardPage`, `LandingPage`, `LoginPage`, `RegisterPage`).
- `SearchModal` e sua logica.
- Eventos de notificacoes.
- Hooks, providers, servicos, APIs, autenticacao, logout ou backend.
- Logica de dark mode.

## Fase 3 - Login e cadastro [implementada]

Objetivo: aplicar o design system nas telas de autenticacao preservando rotas, fluxos, payloads, validacoes, redirects e `useAuth`.

Entregas implementadas:

- `AuthShell.jsx`: shell visual compartilhado para autenticacao, com marca, painel editorial, Bento lateral e card de formulario usando `Card` e `Badge` da Fase 1.
- `AuthShell.css`: fundacao visual compartilhada das telas de auth com tokens, superficies clay leves, grid responsivo, foco visivel e estilos comuns de formularios/selects.
- `LoginPage.jsx`: redesign visual do login com `AuthShell`, `Button` e `TextField`, mantendo `login({ email, senha: password })`, `router.push("/app")`, inputs, `value`, `onChange`, `required`, `autoComplete` e submit handler.
- `LoginPage.css`: ajustes especificos do login sobre o shell compartilhado.
- `RegisterPage.jsx`: redesign visual do cadastro em etapas com `AuthShell`, `Button`, `TextField` e `Badge`, mantendo `handleNext`, `handleSubmit`, payload, valores dos selects, validacoes, campos obrigatorios e redirect para `/app`.
- `RegisterPage.css`: progresso, cards de tipo de conta, notas, acoes e responsividade do cadastro.
- `app/globals.css`: import do `AuthShell.css` antes dos estilos especificos de pagina.
- Textos visiveis com encoding quebrado corrigidos apenas em `LoginPage` e `RegisterPage`.

Correcao complementar antes da Fase 5:

- `AuthShell.css`: shell de autenticacao compactado para desktop, com `min-height: 100dvh` seguro, grid menos dominante no painel lateral, altura visual limitada por viewport, contraste maior nos cards Bento e fluxo vertical natural em telas menores.
- `LoginPage.css`: formulario e painel visual ajustados para remover altura residual e excesso de espacamento em desktop.
- `RegisterPage.css`: progresso, cards de tipo de conta, campos, notas e acoes compactados para reduzir rolagem desnecessaria sem esconder conteudo.
- Marca visivel confirmada como `CollabResearch` em `AuthShell.jsx` e `LoginPage.jsx`.
- Nao houve alteracao em `useAuth`, payloads, validacoes, redirects, rotas, APIs, services, providers, backend, Dashboard, Sidebar, Topbar, LandingPage ou SearchModal.

Nao foi alterado nesta fase:

- `LandingPage`, por restricao explicita da Fase 3 executada neste ciclo.
- `Sidebar`, `Topbar`, `DashboardLayout`, `DashboardPage` ou `SearchModal`.
- Rotas, providers, hooks, servicos, APIs, backend, autenticacao, notificacoes, dark mode ou regras de negocio.

## Fase 4 - Dashboard e estados de conteudo [implementada]

Objetivo: tornar o dashboard orientado a tarefas sem alterar dados, permissoes, services, hooks, rotas ou regras de negocio.

Entregas implementadas:

- `DashboardPage.jsx`: hero compacto orientado a acao, metricas com contexto, cards com `Card`, acoes com `Button`, status com `Badge` e helpers locais para skeleton, header de painel e empty state.
- `DashboardPage.jsx`: preservados `projectService`, `applicationService`, `notificationService`, `useAsyncData`, `useAuth`, `SearchModal`, dados derivados existentes, chamadas de API, loading, erro e navegacao por `router.push`.
- `DashboardPage.jsx`: estados vazios revisados para projetos, inscricoes, sugestoes, notificacoes e grafico de atividade, sem citar API ou detalhes tecnicos.
- `DashboardPage.jsx`: textos visiveis com encoding quebrado corrigidos apenas nesta pagina.
- `DashboardPage.css`: grade responsiva com sintese Bento contida, superficies SaaS modernas, claymorphism leve, metric cards, listas, skeletons, foco visivel e empty states alinhados aos tokens da Fase 1.

Nao foi alterado nesta fase:

- `Sidebar`, `Topbar`, `DashboardLayout`, `SearchModal`, `LoginPage`, `RegisterPage` ou `LandingPage`.
- Rotas, links existentes, providers, hooks compartilhados, services, APIs, backend, autenticacao, notificacoes ou regras de negocio.
- Logica de carregamento, erro, filtros, chamadas de API ou contratos de dados.

## Fase 5 - Landing Page [implementada]

Objetivo: redesenhar a Landing Page do `nextweb` com linguagem visual consistente com Login, Cadastro, Dashboard e Progresso, preservando rotas e comportamento dos CTAs.

Entregas implementadas:

- `LandingPage.jsx`: hero reposicionado com marca `CollabResearch`, titulo direto, descricao curta e CTAs preservados para `/register` e `/login`.
- `LandingPage.jsx`: navegacao, secoes de plataforma, beneficios, recursos, fluxo, CTA final e footer reorganizados com textos visiveis revisados.
- `LandingPage.jsx`: preview de produto mantido como composicao local sem imagens externas obrigatorias e sem alterar regras de negocio.
- `LandingPage.css`: visual 60% SaaS moderno, 25% claymorphism leve e 15% Bento UI, usando a paleta verde/neutra e superficies do produto.
- `LandingPage.css`: espacamento vertical, responsividade desktop/mobile, foco visivel, estados hover/active e protecao contra scroll horizontal.
- `LandingPage.css`: footer mais organizado com links internos e acoes de acesso sem criar novas rotas.

Nao foi alterado nesta fase:

- `LoginPage`, `RegisterPage`, `DashboardPage`, `ProgressPage`, `Sidebar`, `Topbar` ou `SearchModal`.
- Rotas, links dos CTAs, autenticacao, hooks, services, providers, APIs, backend, envs ou regras de negocio.
- Componentes compartilhados.
## Fase 6 - Responsividade e acessibilidade [auditada sem alteracoes adicionais]

Objetivo: finalizar ajustes concretos de responsividade, contraste, foco visivel e acessibilidade.

Resultado da auditoria: todos os atributos de acessibilidade do SearchModal estao presentes (role="dialog", aria-modal, aria-label, aria-hidden). Foco visivel definido em todas as paginas via var(--focus-ring-strong). Overflow horizontal controlado com overflow-x: clip no DashboardLayout. Nenhuma correcao adicional necessaria.

## Fase 7 - Validacao final [concluida]

Objetivo: confirmar qualidade visual, ausencia de regressao e consistencia entre todas as telas.

Checklist executado:

- `npm run lint` — OK (3 warnings preexistentes).
- `npm run build` — OK, todas as rotas compiladas.
- `git diff --check` — OK (apenas warnings de CRLF).
- Validacao visual em 5 rotas: `/`, `/login`, `/register`, `/app`, `/app/progress`.
- Viewports testados: desktop (1440x900, 1366x768), tablet (768x1024), mobile (390x844).
- Overflow horizontal: nenhum caso real encontrado.
- Scroll vertical: funcional em todas as paginas mobile.
- Consistencia visual: Landing, Login e Cadastro usam o mesmo sistema de tokens e paleta verde/neutra.
- Cards, textos, grids: nenhum corte identificado.
- Sidebar e Topbar: utilizaveis em telas estreitas com drawer mobile e overflow controlado.
- Foco visivel: confirmado em botoes, links, inputs, selects, menus e modais.
- Contraste: tokens seguem WCAG AA para texto principal e acoes.
- Conteudo oculto: nenhum caso de overflow: hidden ou clip escondendo conteudo importante.
- Nenhuma alteracao em logica, dados, APIs ou comportamentos funcionais.


