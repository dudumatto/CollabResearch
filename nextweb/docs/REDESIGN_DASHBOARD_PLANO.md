# Plano de Redesign — Dashboard Acadêmico

> **Direção visual:** 60% Linear/Stripe · 25% Dashboard Acadêmico · 15% Bento UI  
> **Inspiração:** Linear, Stripe Dashboard, Notion, GitHub Projects, Vercel Dashboard  
> **O que NÃO queremos:** AdminLTE, template genérico, aparência de IA

---

## Ordem de Implementação

A ordem segue dependência técnica: primeiro a fundação (CSS/tokens), depois layout (sidebar, topbar), depois conteúdo (boas-vindas, métricas, gráficos), por fim responsividade e polimento.

---

## Etapa 1 — Fundação: Organização do CSS e Design Tokens

| Item | Detalhe |
|---|---|
| **O que será alterado** | `globals.css` e `tailwind.config.ts` |
| **Mudanças** | Extrair variáveis CSS para um design system coeso. Renomear `--navy-*` e `--blue-*` para nomes semânticos (`--color-bg`, `--color-surface`, `--color-accent`, `--color-text-primary`, `--color-text-secondary`). Adicionar tokens de `--shadow-sm`, `--shadow-md`, `--shadow-lg` para profundidade. Definir font stack com `Inter` como primary e `JetBrains Mono` para números. Adicionar `@apply` utilities no Tailwind para classes compostas. Separar estilos de páginas específicas (login, reports) para arquivos próprios ou ao menos seções nomeadas. |
| **Arquivos** | `desktop/src/styles/globals.css`, `desktop/tailwind.config.ts` |
| **Risco** | Baixo — estilos globais, sem tocar em lógica. Requer verificar se nenhuma classe CSS usada em outras páginas depende dos nomes antigos. |
| **Por que primeiro** | Tudo herda daqui. Definir tokens primeiro evita retrabalho. |

---

## Etapa 2 — Sidebar

| Item | Detalhe |
|---|---|
| **O que será alterado** | `Sidebar.tsx` + `globals.css` |
| **Mudanças** | Adicionar ícones (Lucide React) em cada link. Reduzir altura dos itens (`py-2 px-3`, sem `min-height: 44px`). Active state com indicador sutil à esquerda (barra fina, 3px, arredondada) + fundo sutil (`bg-white/5` ou similar). Remover `border-left` antigo. Marca "CollabResearch" com logo SVG simples (ícone de livro/compasso + texto). Compactar espaçamento vertical entre seções. Usar `text-sm` em vez de `0.68rem` para labels de seção. Adicionar transições suaves em hover/active. Largura reduzida para `clamp(200px, 16vw, 240px)`. Adicionar tooltip ou collapse para futuro. |
| **Arquivos** | `desktop/src/components/layout/Sidebar.tsx`, `desktop/src/styles/globals.css` |
| **Risco** | Baixo — componente puramente de apresentação. Navegação via `NavLink` permanece intacta. |
| **Por que segundo** | Define a estrutura vertical do layout; topbar e workspace dependem da sidebar existir. |

---

## Etapa 3 — Topbar / Header

| Item | Detalhe |
|---|---|
| **O que será alterado** | `Topbar.tsx` + `globals.css` |
| **Mudanças** | Substituir "Bem-vindo, {nome}" por algo mais útil. Adicionar campo de busca global (CMD+K style) no centro, mais destacado. Adicionar botão de notificações com indicador de badge. Área do usuário com avatar (iniciais em círculo), dropdown para sair/configurações. Reduzir altura de 76px para ~56-60px. Remover "Painel administrativo" (redundante). Fundo com `backdrop-filter: blur(12px)` e leve translucidez para efeito glass. |
| **Arquivos** | `desktop/src/components/layout/Topbar.tsx`, `desktop/src/styles/globals.css` |
| **Risco** | Baixo — não altera autenticação nem lógica de logout. Apenas muda apresentação. |
| **Por que terceiro** | Depende da sidebar estar definida para alinhamento correto. |

---

## Etapa 4 — Seção de Boas-Vindas

| Item | Detalhe |
|---|---|
| **O que será alterado** | `DashboardPage.tsx` (JSX) + `globals.css` |
| **Mudanças** | Substituir o `page-header` atual. Criar um banner/card de boas-vindas que ocupe a largura total. Conteúdo: saudação contextual ("Bom dia, {nome}" com hora), resumo acadêmico compacto (ex: "X projetos ativos · Y orientadores · Z alunos matriculados"). Adicionar um elemento visual relacionado a pesquisa científica (ícone decorativo ou ilustração sutil — atom, DNA, livro, etc). Barra de progresso acadêmico (ex: "Semestre 2026.1 · 67% concluído"). Fundo com gradiente sutil (dark green → teal) para destaque visual sem poluir. |
| **Arquivos** | `desktop/src/features/dashboard/DashboardPage.tsx`, `desktop/src/styles/globals.css` |
| **Risco** | Médio — mexe no JSX do DashboardPage. Cuidado para não alterar a lógica de loading/error. Deve manter `data`, `error`, `load` intactos. |
| **Por que quarto** | Depende de topbar e sidebar estarem prontas para alinhamento visual. |

---

## Etapa 5 — Cards de Métricas (StatCards)

| Item | Detalhe |
|---|---|
| **O que será alterado** | `StatCard.tsx` (componente) + `DashboardPage.tsx` (grid) + `globals.css` |
| **Mudanças** | Redesenho completo do `StatCard`. Adicionar ícone contextual por card (ex: Users → UserIcon, Projetos → FolderIcon). Número em destaque com `font-bold text-3xl`. Descrição abaixo com `text-sm text-secondary`. Adicionar mini trending indicator (seta pra cima/baixo com cor verde/vermelha + percentual). Background com variação sutil de cor/ícone por card para diferenciar visualmente sem perder coesão. Grid com `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` e `gap: 16px`. Reduzir padding interno para `p-4`. Cards podem ter `hover:shadow-md` e `transition`. |
| **Arquivos** | `desktop/src/components/dashboard/StatCard.tsx`, `desktop/src/features/dashboard/DashboardPage.tsx`, `desktop/src/styles/globals.css` |
| **Risco** | Baixo — componente apenas visual. Props permanecem `label`, `value`, `detail`. |
| **Por que quinto** | Depende da seção de boas-vindas estar definida para alinhar grid abaixo. |

---

## Etapa 6 — Gráfico e Atividades Recentes

| Item | Detalhe |
|---|---|
| **O que será alterado** | `ChartCard.tsx`, `RecentActivity.tsx` + `globals.css` |
| **Mudanças** | **ChartCard**: Manter barras mas melhorar visual — bordas arredondadas, cores gradiente, animação de largura. Adicionar total no topo ("X usuários no total"). Tooltip ou label mais visível nos valores. **RecentActivity**: Adicionar ícones por tipo de ação (CRIAR → plus-circle verde, REMOVER → trash vermelho, ATUALIZAR → edit azul). Usar relative time ("há 2 horas") via `Intl.RelativeTimeFormat`. Melhorar separação visual entre eventos. Badge do tipo de ação colorido. Grid da dashboard pode ficar mais assimétrico (ex: 60% chart / 40% activities). |
| **Arquivos** | `desktop/src/components/dashboard/ChartCard.tsx`, `desktop/src/components/dashboard/RecentActivity.tsx`, `desktop/src/styles/globals.css` |
| **Risco** | Baixo — componentes puramente visuais. Props (`items`, `title`) permanecem. |
| **Por que sexto** | Última seção de conteúdo do dashboard; fecha a grade inferior. |

---

## Etapa 7 — Responsividade

| Item | Detalhe |
|---|---|
| **O que será alterado** | `globals.css` (media queries) |
| **Mudanças** | Revisar todos os breakpoints. Adicionar breakpoint para `1600px` (wide desktop) com grid de 4 colunas nos cards. Ajustar sidebar para collapsible em `<1024px` (pode virar drawer). Melhorar transição de sidebar horizontal em mobile (<920px). Garantir que topbar não empilhe feio — search pode recolher para ícone. Cards de métricas: em `<640px` usar 2 colunas. Gradiente da seção de boas-vindas deve adaptar altura. Adicionar `transition` em todas as mudanças de layout. |
| **Arquivos** | `desktop/src/styles/globals.css` |
| **Risco** | Médio — media queries podem afetar outras páginas. Testar em todas as rotas existentes. |
| **Por que sétimo** | Polimento final; deve vir depois que todo o layout está definido. |

---

## Etapa 8 — Polimento Visual Final

| Item | Detalhe |
|---|---|
| **O que será alterado** | Múltiplos arquivos |
| **Mudanças** | Revisar contrastes (WCAG AA). Micro-interações: hover em cards, transição em sidebar, focus states. Sombreados consistentes. Verificar se a paleta final não lembra template genérico. Testar legibilidade em monitores externos. Ajustar tracking (letter-spacing) para títulos. Verificar se a densidade de informação está adequada (nem vazia, nem poluída). |
| **Arquivos** | `globals.css` + ajustes pontuais em componentes |
| **Risco** | Baixo — apenas ajustes finos |
| **Por que oitavo** | Deve ser o último para não desperdiçar trabalho em ajustes que seriam sobrescritos. |

---

## Checklist de Arquivos a Modificar

| Arquivo | Etapa |
|---|---|
| `desktop/src/styles/globals.css` | 1, 2, 3, 4, 5, 6, 7, 8 |
| `desktop/tailwind.config.ts` | 1 |
| `desktop/src/components/layout/Sidebar.tsx` | 2 |
| `desktop/src/components/layout/Topbar.tsx` | 3 |
| `desktop/src/features/dashboard/DashboardPage.tsx` | 4, 5 |
| `desktop/src/components/dashboard/StatCard.tsx` | 5 |
| `desktop/src/components/dashboard/ChartCard.tsx` | 6 |
| `desktop/src/components/dashboard/RecentActivity.tsx` | 6 |
| `desktop/src/components/ui/Card.tsx` (possível) | 5 |

## Arquivos que NÃO serão tocados (protegidos)

| Arquivo | Motivo |
|---|---|
| `dashboardTypes.ts` | Tipos de dados |
| `dashboardService.ts` | Chamada de API |
| `apiClient.ts` | Cliente HTTP |
| `authStore.ts`, `authService.ts` | Autenticação |
| `date.ts`, `auditFormatters.ts` | Formatação de dados |
| `AdminShell.tsx` | Layout shell (a menos que precise de ajuste mínimo) |
| `router.tsx` | Rotas |
| `providers.tsx` | Providers |
| `App.tsx` | Entry point |

## Resumo de Riscos

| Risco | Nível | Mitigação |
|---|---|---|
| Quebrar layout de outras páginas ao alterar CSS global | Médio | Usar classes específicas, não alterar seletivas genéricas (`.card`, `.page`) sem verificar uso |
| Perder contraste acessível com paleta nova | Baixo | Verificar contraste mínimo 4.5:1 para texto normal |
| Sidebar quebrar em mobile | Baixo | Manter estrutura NavLink, testar em viewport < 920px |
| Mudanças no JSX do DashboardPage afetarem loading/error | Médio | Manter blocos `if (error)` e `if (!data)` intactos, alterar apenas JSX de retorno |

---

## Problemas Identificados na Análise

1. **Sidebar genérica** — sem ícones, altura excessiva, active state datado (border-left)
2. **Topbar sem função** — 76px só para "Bem-vindo, Nome", sem busca ou notificações
3. **Boas-vindas inexistente** — título + frase genérica, sem informação útil
4. **StatCards vazios** — ~70% de espaço vazio, sem ícone, tendência ou contexto
5. **Hierarquia visual plana** — todos os elementos com mesmo peso, sem diferenciação
6. **ChartCard sub-utilizado** — 3 barras simples, muito padding para pouca informação
7. **RecentActivity genérico** — sem ícones, sem relative time, sem cores por tipo de ação
8. **Excesso de bordas** — cards, topbar, atividades — tudo dependente de borda para definição
9. **Sombras tímidas** — única shadow quase imperceptível, sem profundidade
10. **Tipografia sem hierarquia** — h2 muito próximo de texto comum, sem variação de peso
11. **Paleta monocromática genérica** — verde "eco" overused, nomes de variáveis inconsistentes
12. **Zero identidade acadêmica** — sem referência visual a universidade ou pesquisa
13. **Grid desbalanceado** — colunas quase simétricas para conteúdos de peso diferente
14. **Responsividade básica** — transições bruscas, sidebar horizontal feia em mobile
15. **CSS bagunçado** — 419 linhas com classes soltas, mistura de páginas, sem uso de Tailwind
