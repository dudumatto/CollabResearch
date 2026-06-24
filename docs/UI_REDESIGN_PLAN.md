# Plano de Redesign de UI — CollabResearch

**Status:** Proposto  
**Escopo:** Landing page, autenticação, cadastro, dashboard e componentes compartilhados  
**Objetivo visual:** 60% SaaS Moderno (Linear + Stripe), 25% Claymorphism leve, 15% Bento UI  
**Restrições obrigatórias:** não alterar regras de negócio, APIs, contratos de dados ou rotas existentes.

---

## 1. Objetivo do redesign

Construir uma interface única, coerente e profissional para o CollabResearch, com aparência de produto SaaS acadêmico maduro. O redesign deve melhorar a clareza das ações, reduzir espaços desperdiçados, resolver inconsistências entre landing, login, cadastro e dashboard, e tornar estados vazios úteis para o usuário.

O resultado deve transmitir:

- **Clareza e precisão:** inspiração Linear, com hierarquia forte, poucas distrações e navegação previsível.
- **Confiança e refinamento:** inspiração Stripe, com superfícies limpas, tipografia bem resolvida e CTAs objetivos.
- **Acolhimento visual sutil:** profundidade discreta por sombras macias, bordas suaves e pequenos relevos — sem excesso de “efeito 3D”.
- **Organização modular:** uso pontual de Bento UI para agrupar informações do dashboard por prioridade.

---

## 2. Escopo funcional preservado

Este plano reorganiza apenas a experiência visual e a apresentação dos fluxos existentes.

### Não alterar

- Regras de negócio de projetos, inscrições, mensagens, notificações, perfil ou progresso.
- Endpoints, serviços, autenticação, APIs, modelos de dados e integrações.
- Rotas públicas, rotas autenticadas, URLs, permissões ou papéis de usuário.
- Conteúdo obrigatório dos formulários e ações já existentes.

### Pode alterar

- Estrutura visual de páginas e componentes.
- Ordem visual de blocos que exibem os mesmos dados.
- Textos de interface, mensagens de estado vazio e microcopy.
- Tokens de cores, tipografia, bordas, sombras, espaçamentos e tamanhos.
- Estados de hover, foco, erro, carregamento, vazio e sucesso.

---

## 3. Problemas que o redesign deve resolver

1. **Inconsistência entre telas:** landing clara, login dividido, cadastro muito escuro e dashboard com linguagem diferente.
2. **Dashboard pouco orientado à ação:** muitos cards com valor `0`, muitos vazios e pouca priorização do próximo passo.
3. **Espaçamento excessivo:** hero do dashboard, login e cadastro desperdiçam área útil em desktop.
4. **Hierarquia fraca:** conteúdo secundário compete com ações essenciais, especialmente no dashboard.
5. **Estados vazios técnicos:** mensagens mencionam API em vez de orientar o usuário.
6. **Acessibilidade insuficiente:** contraste baixo em alguns textos, foco pouco evidente e estados dependentes de cor.
7. **Risco de baixa adaptação em telas menores:** sidebar fixa, navbar extensa e grids horizontais sem estratégia de colapso.
8. **Problema crítico de encoding:** textos como `notificaÃ§Ãµes` e `inscriÃ§Ãµes` devem ser corrigidos antes da entrega visual.

---

## 4. Direção de design

### 4.1 Princípios visuais

| Princípio | Decisão de design |
|---|---|
| Foco | Cada tela deve ter uma ação principal clara. |
| Contenção | Menos gradientes, menos sombras e menos blocos decorativos. |
| Consistência | Um único sistema visual para público, autenticação e produto autenticado. |
| Escaneabilidade | Títulos claros, agrupamentos previsíveis e informação fácil de ler rapidamente. |
| Profundidade leve | Claymorphism somente como acabamento em cards, inputs e superfícies de destaque. |
| Modulação | Bento UI apenas em áreas de síntese, sem transformar toda a interface em um mosaico. |

### 4.2 Linguagem visual recomendada

- Fundo base claro e levemente aquecido, evitando branco puro em todas as áreas.
- Verde institucional como cor de ação e confirmação, nunca como decoração em excesso.
- Texto quase preto com leve tom esverdeado para reduzir dureza visual sem perder contraste.
- Cards brancos ou muito claros com borda fina e sombra baixa.
- Gradientes restritos a áreas de destaque: CTA primário, hero de landing, card de progresso e seleção de papel no cadastro.
- Ícones lineares simples, com espessura visual consistente.

---

## 5. Design system

### 5.1 Paleta de cores

As cores devem ser criadas como tokens semânticos, para que os componentes usem papéis visuais, não valores soltos.

| Token | Uso | Cor sugerida |
|---|---|---|
| `brand-600` | CTA principal, links ativos, foco | `#1F7A5A` |
| `brand-700` | Hover de CTA, texto forte em verde | `#166548` |
| `brand-100` | Fundo de seleção, badges suaves | `#E7F4ED` |
| `brand-50` | Fundo de destaque muito sutil | `#F3FAF6` |
| `ink-900` | Títulos e dados importantes | `#17251E` |
| `ink-700` | Texto principal | `#3D4D45` |
| `ink-500` | Texto secundário | `#66756E` |
| `surface-0` | Fundo principal | `#F7F9F7` |
| `surface-1` | Cards e inputs | `#FFFFFF` |
| `surface-2` | Área secundária, hover suave | `#F0F4F1` |
| `border-subtle` | Bordas padrão | `#D9E4DC` |
| `success` | Confirmação e aprovado | `#16805C` |
| `warning` | Atenção e pendência | `#B7791F` |
| `danger` | Erro e remoção | `#C2413B` |
| `info` | Informação neutra | `#2F6F9F` |

**Regra de contraste:** todo texto informativo e toda ação devem atender no mínimo WCAG AA. Não usar verde claro sobre fundo branco para conteúdo essencial.

### 5.2 Superfícies, bordas e profundidade

| Elemento | Especificação |
|---|---|
| Card padrão | Fundo `surface-1`, borda de 1 px `border-subtle`, raio de 16 px, sombra curta e discreta. |
| Card de destaque | Fundo com gradiente muito suave de `brand-50` para branco, borda verde translúcida, mesma sombra do card padrão. |
| Input | Fundo branco, borda sutil, raio de 12 px, profundidade interna mínima. |
| Modal | Fundo branco, raio de 20 px, sombra elevada e backdrop escuro com baixa opacidade. |
| Botão primário | Gradiente verde contido, sem brilho intenso; sombra apenas no hover/foco. |

**Claymorphism leve:** usar em no máximo três lugares por tela: CTA principal, card de progresso/atividade e campos de formulário. Evitar sombras grandes, contornos grossos e efeitos de plástico.

### 5.3 Bordas e raios

| Tipo | Raio |
|---|---:|
| Badge, chip, avatar pequeno | 999 px |
| Input e botão | 10–12 px |
| Card comum | 14–16 px |
| Card principal e modal | 18–20 px |
| Painel de hero | 20–24 px |

### 5.4 Ícones

- Usar uma única biblioteca de ícones lineares em toda a aplicação.
- Tamanho padrão: 18 px em controles, 20 px em navegação, 24 px em cards de resumo.
- Todos os ícones interativos devem ter rótulo acessível, tooltip e área clicável mínima de 40 × 40 px.
- Não usar ícone como única indicação de estado crítico sem texto ou tooltip.

---

## 6. Tipografia

### 6.1 Família tipográfica

**Fonte principal recomendada:** `Inter`.

Motivos: ótima legibilidade em interface, bom suporte para português, aparência próxima ao padrão de SaaS moderno e ampla disponibilidade para web.

**Fallback:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

### 6.2 Escala tipográfica

| Uso | Tamanho | Peso | Altura de linha |
|---|---:|---:|---:|
| Display / hero da landing | 48–56 px | 700 | 1.05–1.12 |
| Título de página | 28–32 px | 700 | 1.2 |
| Título de seção | 20–24 px | 650–700 | 1.25 |
| Título de card | 16–18 px | 600 | 1.35 |
| Texto principal | 14–16 px | 400–500 | 1.5 |
| Label de formulário | 13–14 px | 600 | 1.35 |
| Texto auxiliar | 12–13 px | 400–500 | 1.45 |
| Métrica destacada | 28–36 px | 700 | 1.1 |

### 6.3 Regras tipográficas

- Não usar mais de três pesos visíveis em uma mesma tela.
- Não depender de texto pequeno para conteúdo importante.
- Usar frase normal em botões e labels; evitar CAIXA ALTA.
- Títulos devem comunicar contexto, não apenas nomear a área. Exemplo: `Projetos` pode receber apoio como `Encontre oportunidades compatíveis com seu perfil` quando necessário.

---

## 7. Sistema de espaçamentos

### 7.1 Escala base

Usar grid de 4 px, com os seguintes tokens:

| Token | Valor | Uso típico |
|---|---:|---|
| `space-1` | 4 px | Ajustes internos mínimos |
| `space-2` | 8 px | Ícone + texto, grupos compactos |
| `space-3` | 12 px | Inputs, badges, itens de menu |
| `space-4` | 16 px | Padding de card compacto |
| `space-5` | 20 px | Separação entre campos |
| `space-6` | 24 px | Padding padrão de card |
| `space-8` | 32 px | Separação entre blocos importantes |
| `space-10` | 40 px | Separação entre seções |
| `space-12` | 48 px | Margem de página em desktop |
| `space-16` | 64 px | Seções grandes de landing |

### 7.2 Regras de layout

- Conteúdo autenticado: padding de 24 px em desktop e 16 px em telas compactas.
- Cards padrão: 20–24 px de padding; reduzir para 16 px em mobile.
- Distância entre título de página e primeira seção: 24–32 px.
- Distância entre título de card e conteúdo: 12–16 px.
- Evitar cards altos com conteúdo concentrado no canto; a altura deve responder ao conteúdo ou incluir ações úteis.

---

## 8. Componentes fundamentais

### 8.1 Botões

| Tipo | Uso | Diretriz |
|---|---|---|
| Primário | Ação principal da tela | Verde institucional, texto branco, ícone opcional à direita. |
| Secundário | Alternativa relevante | Fundo branco, borda sutil, texto escuro. |
| Terciário | Ação contextual | Sem caixa visual; texto verde e ícone discreto. |
| Perigo | Exclusão ou ação irreversível | Vermelho sem gradiente. |
| Ícone | Ações rápidas | Área mínima de 40 px, tooltip e foco perceptível. |

- Cada seção deve ter no máximo uma ação primária dominante.
- Hover deve alterar levemente cor, borda ou sombra; não usar animações agressivas.
- Estado desabilitado deve continuar legível, sem parecer ação ativa.

### 8.2 Badges e status

- Usar cor + ícone/texto, nunca cor isolada.
- Exemplos de status: `Aberto`, `Em andamento`, `Finalizado`, `Aprovado`, `Pendente`, `Novo`.
- Tamanho compacto, mas com contraste alto e linguagem simples.

### 8.3 Estados de carregamento e vazio

- Todo bloco dependente de dados deve ter três estados definidos: carregando, vazio e erro.
- Mensagens não devem citar APIs, endpoints ou detalhes técnicos.
- Estado vazio deve sempre indicar contexto + próximo passo + ação, quando existir.

Exemplo para projetos recentes:

> **Você ainda não participa de nenhum projeto**  
> Explore projetos abertos e encontre uma oportunidade compatível com seus interesses.  
> Ação: **Buscar projetos**

---

## 9. Sidebar

### 9.1 Estrutura

A sidebar deve ser a âncora de navegação do produto, sem competir com o conteúdo principal.

- Largura expandida: 248–256 px.
- Largura recolhida: 72 px.
- Fundo claro com borda direita sutil; evitar blocos muito pesados.
- Logo no topo, navegação agrupada no meio e configurações no rodapé.
- Exibir papel do usuário abaixo ou próximo ao perfil, sem duplicar informação.

### 9.2 Itens de navegação

- Área clicável de no mínimo 40 px de altura.
- Ícone alinhado à esquerda; label com peso médio.
- Item ativo: fundo verde muito claro, ícone/label em `brand-600` e indicador lateral de 3 px.
- Item em hover: fundo `surface-2`, sem mudança brusca de layout.
- Agrupar itens por objetivo: `Explorar`, `Acompanhar`, `Conta`.

### 9.3 Responsividade da sidebar

- Desktop: expandida por padrão.
- Tablet: recolhida por padrão, expansível por botão claro no topo.
- Mobile: virar drawer temporário com backdrop e fechamento por teclado/toque fora.

---

## 10. Dashboard

### 10.1 Nova estrutura de prioridade

O dashboard deve responder, em ordem, a quatro perguntas:

1. O que preciso fazer agora?
2. Qual é meu status atual?
3. O que aconteceu recentemente?
4. Onde encontro novas oportunidades?

### 10.2 Cabeçalho de página

Substituir o hero grande por um cabeçalho compacto e orientado a tarefa.

**Estrutura recomendada:**

- Saudação curta: `Olá, Eduardo`.
- Linha de contexto: data ou resumo real de pendências.
- CTA principal: `Buscar projetos` para aluno sem projeto; `Criar projeto` para orientador quando aplicável.
- CTA secundário: `Ver progresso`, apenas quando houver progresso disponível.

O cabeçalho deve ter altura contida, suficiente para orientar sem empurrar o conteúdo importante para baixo.

### 10.3 Grade Bento

Usar Bento UI para síntese, não para excesso de cartões.

**Desktop sugerido:**

- Linha 1: até três métricas úteis e contextualizadas.
- Linha 2: card principal de `Projetos recentes` ocupando cerca de dois terços da grade; card de `Próximas ações` ou `Notificações` no terço restante.
- Linha 3: `Minhas inscrições` e `Projetos sugeridos`, adaptados ao estado do usuário.

**Regras:**

- Ocultar ou rebaixar métricas que estejam em `0` e não gerem ação.
- Não manter um card inteiro apenas para exibir o número zero.
- Cada card deve ter uma finalidade clara: informar, orientar ou permitir agir.

### 10.4 Métricas

Manter no máximo três métricas na primeira dobra, escolhidas pelo perfil e pelo estado real do usuário.

Para aluno sem participação:

- Projetos ativos.
- Inscrições pendentes.
- Atualizações não lidas.

Para orientador:

- Projetos ativos.
- Inscrições para revisar.
- Mensagens ou entregas pendentes.

### 10.5 Estados vazios

| Área | Mensagem orientada | Ação |
|---|---|---|
| Projetos recentes | Você ainda não participa de nenhum projeto. | Buscar projetos |
| Minhas inscrições | Você ainda não enviou inscrições. | Explorar projetos |
| Projetos sugeridos | Complete seu perfil acadêmico para receber sugestões melhores. | Atualizar perfil |
| Notificações | Tudo em dia por aqui. Novas atualizações aparecerão neste espaço. | Ver configurações |

### 10.6 Busca global

- Manter no topo, mas dar comportamento visual de comando rápido.
- Placeholder específico: `Buscar projetos, pessoas ou mensagens…`.
- Tecla de atalho visível, mas discreta.
- Em telas menores, transformar a busca em botão de ícone que abre modal/overlay de busca.

---

## 11. Landing page

### 11.1 Hero

Preservar a proposta de valor, mas fortalecer a hierarquia.

- Título de até três linhas, com uma única palavra ou trecho em verde.
- Texto de apoio mais curto e mais direto.
- CTA principal: `Criar conta grátis`.
- CTA secundário: `Fazer login`.
- Elementos de confiança abaixo dos CTAs em texto legível, com ícones pequenos e espaçamento compacto.
- Mockup do produto deve ter contraste suficiente para que os cartões internos sejam percebidos.

### 11.2 Navegação pública

- Limitar links de topo a páginas realmente existentes e úteis.
- Em tela compacta, trocar links por menu de navegação.
- `Criar conta` deve continuar como CTA visível em desktop, mas não competir com o botão principal do hero.

### 11.3 Bloco de métricas

- Manter indicadores, mas reduzi-los visualmente para atuar como prova social, não como foco principal.
- Utilizar fundo levemente diferenciado e divisores discretos.
- Em mobile, organizar em grade 2 × 2.

---

## 12. Login e cadastro

### 12.1 Login

A tela de login deve priorizar a tarefa de entrar, sem perder o contexto institucional.

- Em desktop, manter composição em duas colunas, mas reduzir a dominância do painel verde.
- Formulário em card com largura aproximada de 420–460 px, melhor alinhado ao centro da coluna.
- Adicionar link visível de `Esqueci minha senha` sem alterar a rota existente; usar a ação disponível no produto ou esconder até existir fluxo válido.
- Reforçar labels, descrição de campos e erros em linha.
- Checkbox `Manter conectado` com área clicável ampla e texto legível.

### 12.2 Cadastro

A tela de cadastro não deve parecer outro produto. Substituir o dark mode pesado por uma variante do mesmo sistema claro ou por uma superfície escura mais neutra e consistente, com contraste validado.

**Recomendação principal:** usar fundo claro igual ao login e destacar o progresso e a seleção de tipo de conta com verde institucional.

- Stepper com número, título e estado textual; não depender só de cor.
- Cartões `Aluno` e `Orientador` com descrição objetiva, área clicável grande e seleção visível por borda, ícone de confirmação e texto.
- Botão `Continuar` fixado ao final do card em mobile, quando necessário.
- Exibir ajuda contextual sobre cada perfil antes da confirmação.

### 12.3 Formulários

| Elemento | Diretriz |
|---|---|
| Label | Sempre visível acima do campo; placeholder não substitui label. |
| Input | Altura confortável, texto de 14–16 px, ícone apenas quando agrega valor. |
| Foco | Borda verde de alto contraste + anel de foco perceptível. |
| Erro | Texto objetivo abaixo do campo + ícone, sem depender só de vermelho. |
| Sucesso | Confirmação curta, sem bloquear a continuação. |
| Ajuda | Texto auxiliar discreto e específico. |
| Senha | Controle de mostrar/ocultar deve ter rótulo acessível. |

---

## 13. Cards

### 13.1 Tipos de card

| Tipo | Uso | Características |
|---|---|---|
| Resumo | Métricas e status | Compacto, número importante, label e contexto. |
| Conteúdo | Projetos, inscrições, mensagens | Título, metadados, ação contextual e estado vazio. |
| Destaque | Progresso ou próxima ação | Gradiente sutil, ícone e CTA; usar com moderação. |
| Seleção | Tipo de conta, filtros, opções | Borda clara, estado ativo perceptível e área clicável inteira. |

### 13.2 Regras

- Card não deve existir somente para “encher” a grade.
- Evitar vários cards com mesma altura quando os conteúdos são diferentes.
- Não usar sombra forte em todos os componentes; priorizar bordas e contraste de superfície.
- Ação do card deve ser clara: card clicável inteiro ou botão/link explícito, nunca os dois sem necessidade.

---

## 14. Tabelas e listas de dados

### 14.1 Estrutura

Tabelas devem ser usadas para comparação e gestão; cards devem ser usados para descoberta e síntese.

- Cabeçalho fixo apenas em listas longas.
- Densidade padrão: linha de 52–56 px.
- Primeira coluna deve identificar o item com maior clareza: título + metadado secundário.
- Colunas de status devem usar badge textual.
- Ações devem ficar na última coluna, com menu contextual de ícone e tooltip.

### 14.2 Estados

| Estado | Diretriz |
|---|---|
| Carregando | Skeleton com largura semelhante ao conteúdo esperado. |
| Vazio | Mensagem clara, contexto e CTA. |
| Erro | Explicar que não foi possível carregar e oferecer `Tentar novamente`. |
| Sem resultados | Exibir termo pesquisado, limpar filtros e sugerir alternativa. |

### 14.3 Responsividade

- Em telas pequenas, transformar tabelas em lista de cards com rótulos de campo.
- Preservar ações essenciais visíveis; evitar scroll horizontal para fluxos frequentes.
- Quando scroll horizontal for inevitável, manter primeira coluna identificadora fixa ou priorizada.

---

## 15. Modais e painéis laterais

### 15.1 Quando usar modal

Usar modal para confirmações, ações rápidas, filtros, visualização curta e formulários pequenos. Não usar modal para jornadas longas ou edição complexa.

### 15.2 Especificação

| Tipo | Largura recomendada | Uso |
|---|---:|---|
| Pequeno | 400–480 px | Confirmação, alerta, ação irreversível |
| Médio | 560–640 px | Formulário curto, detalhes, filtro |
| Grande | 720–840 px | Conteúdo denso, visualização completa |
| Side panel | 400–480 px | Detalhes de projeto, filtros persistentes |

### 15.3 Regras de UX

- Título claro e descritivo.
- Botão de fechar acessível por teclado e leitor de tela.
- CTA primário alinhado à direita; ação de cancelar secundária.
- Foco preso dentro do modal enquanto aberto e devolvido ao gatilho ao fechar.
- Confirmação destrutiva deve explicar consequência e usar texto explícito, como `Excluir projeto`.

---

## 16. Responsividade

### 16.1 Faixas de layout

| Faixa | Largura | Decisões principais |
|---|---:|---|
| Desktop amplo | 1440 px ou mais | Sidebar expandida, grade Bento completa, até 3 métricas. |
| Desktop padrão | 1024–1439 px | Sidebar expandida ou recolhida conforme espaço, 2–3 colunas. |
| Tablet | 768–1023 px | Sidebar recolhida, cards em 2 colunas, busca compacta. |
| Mobile | até 767 px | Drawer para navegação, uma coluna, CTAs maiores, tabelas viram listas. |

### 16.2 Regras por tela

- **Landing:** menu vira drawer; hero empilha texto e mockup; métricas em 2 × 2.
- **Login:** painel institucional fica acima do formulário ou é reduzido a bloco curto; card ocupa largura disponível.
- **Cadastro:** etapas com labels curtas ou progresso vertical; opções de perfil empilhadas; botão principal visível no fim da tela.
- **Dashboard:** uma coluna; métricas em rolagem horizontal controlada ou lista vertical; ações principais permanecem no topo.

---

## 17. Acessibilidade

### 17.1 Requisitos mínimos

- Contraste AA para texto, ações, estados de erro e badges.
- Navegação completa por teclado.
- Indicador de foco visível em todos os controles interativos.
- Labels associadas a inputs; placeholder não substitui label.
- Ícones interativos com nome acessível e tooltip.
- Estado selecionado indicado por mais de uma pista visual: cor + borda + texto/ícone.
- Mensagens de erro claras, próximas ao campo e compreensíveis sem cor.
- Hierarquia semântica de títulos consistente em cada página.
- Respeito a preferência de redução de movimento.
- Áreas de toque com pelo menos 40 × 40 px.

### 17.2 Correção obrigatória de conteúdo

- Corrigir o encoding de todos os textos antes de validar o redesign.
- Revisar acentuação, plural, capitalização e consistência de termos como `Inscrições`, `Notificações`, `Configurações` e `Iniciação científica`.

---

## 18. Plano de execução por fases

### Fase 0 — Preparação e segurança visual

**Objetivo:** garantir que a implementação não altere comportamento do produto.

- Mapear páginas, componentes e estados existentes.
- Registrar quais dados, botões, rotas e serviços cada tela já utiliza.
- Corrigir encoding e inconsistências textuais visíveis.
- Criar checklist de não regressão: login, cadastro, sidebar, busca, projetos, inscrições, notificações e perfil.

**Entrega:** inventário visual e funcional validado.

### Fase 1 — Fundação do design system

**Objetivo:** criar consistência antes de redesenhar telas inteiras.

- Definir tokens de cor, tipografia, spacing, borda, raio e sombra.
- Padronizar botões, inputs, badges, cards, empty states e feedbacks.
- Validar contraste e foco de teclado.

**Entrega:** biblioteca de componentes base com estados padrão.

### Fase 2 — Landing, login e cadastro

**Objetivo:** unificar a primeira impressão do produto.

- Aplicar a mesma linguagem de cores, tipografia e superfície.
- Melhorar CTA, hierarquia, responsividade e validação visual de formulários.
- Ajustar o cadastro para não parecer uma aplicação separada.

**Entrega:** fluxo público e de autenticação visualmente consistente.

### Fase 3 — Navegação e dashboard

**Objetivo:** tornar o produto autenticado orientado a tarefas.

- Redesenhar sidebar e header.
- Compactar o hero de boas-vindas.
- Reorganizar dashboard em grade Bento com prioridade clara.
- Criar estados vazios que conduzam a uma próxima ação.

**Entrega:** dashboard útil mesmo para usuário sem projetos, inscrições ou notificações.

### Fase 4 — Listas, tabelas, modais e telas secundárias

**Objetivo:** garantir consistência operacional.

- Padronizar listagens de projetos, inscrições, mensagens e notificações.
- Criar padrão único para filtros, ações de linha, modais e side panels.
- Revisar estados de carregamento, erro, vazio e sem resultados.

**Entrega:** componentes escaláveis para o restante do sistema.

### Fase 5 — Validação final

**Objetivo:** verificar qualidade sem alterar regras de negócio.

- Teste visual em desktop, tablet e mobile.
- Teste de teclado e foco.
- Checagem de contraste e legibilidade.
- Conferência de textos, encoding e estados sem dados.
- Regressão dos fluxos existentes, confirmando rotas, APIs e comportamento preservados.

**Entrega:** checklist de aceite preenchido e redesign pronto para integração.

---

## 19. Critérios de aceite

O redesign estará pronto quando:

- [ ] Todas as telas fizerem parte do mesmo sistema visual.
- [ ] Não houver texto com encoding quebrado.
- [ ] Cada página possuir uma ação principal claramente visível.
- [ ] O dashboard não exibir grandes cards vazios sem orientação.
- [ ] Estados vazios oferecerem contexto e próxima ação relevante.
- [ ] Sidebar, navbar, cards e formulários se adaptarem às faixas de layout definidas.
- [ ] Campos de formulário possuírem label, foco, erro e feedback compreensíveis.
- [ ] Contraste e navegação por teclado estiverem validados.
- [ ] Tabelas e listas tiverem comportamento definido para tela pequena.
- [ ] Nenhuma rota, API, regra de negócio ou permissão tiver sido alterada.

---

## 20. Resultado esperado

O CollabResearch deve deixar de parecer uma coleção de telas com estilos diferentes e passar a se comportar visualmente como uma plataforma acadêmica SaaS única: objetiva, confiável, legível e preparada para crescer.

A landing deve converter com clareza. O login e o cadastro devem reduzir fricção. O dashboard deve orientar a próxima ação do usuário. E os componentes compartilhados devem sustentar novas telas sem criar novas inconsistências.
