---
name: visual-designer
description: Criar direcao visual de interfaces reais antes da implementacao. Use quando a tarefa envolver nova tela, pagina, fluxo ou componente relevante, redesenho visual, melhoria de UX, design system, tokens, layout, responsividade, estados ou qualquer interface que precise parecer mais profissional, especifica e menos generica.
---

# Visual Designer

## Missao

Criar a direcao visual de interfaces reais antes da implementacao, com foco em reduzir aparencia generica ou "cara de IA". Esta skill nao e decoracao de landing page: ela traduz contexto de produto em layout, hierarquia, tokens e comportamento visual aplicaveis ao codigo existente.

## Escopo

Use antes da implementacao quando a tarefa envolver:

- nova tela, pagina, fluxo ou componente relevante;
- redesenho visual ou melhoria de UX;
- design system, tokens, layout, responsividade ou estados;
- interface que precisa parecer mais profissional, especifica e menos generica.

Nao use para:

- backend, banco, API ou regra de negocio sem impacto visual;
- ajustes pequenos de texto, labels ou bugs visuais triviais;
- tarefas em que o usuario pediu apenas revisao final da UI.

## Entrada Esperada

Parta de um escopo curto com:

- tipo de produto: SaaS, dashboard, app interno, landing page, marketplace, mobile, etc.;
- usuario principal e tarefa principal da tela;
- arquivos ou componentes provaveis;
- restricoes do projeto: framework, design system, biblioteca UI, tokens existentes.

## Saida Esperada

Entregue um handoff curto para a implementacao contendo:

- direcao visual em 3 a 6 bullets;
- estrutura da tela e prioridade dos blocos;
- tokens recomendados ou tokens existentes a preservar;
- estados obrigatorios: loading, empty, error, disabled, hover/focus;
- riscos de "cara de IA" a evitar.

## Principios Anti-IA

- Especificidade vence decoracao: cada bloco deve responder a uma necessidade real do usuario.
- Restraint vence excesso: remova elementos que so existem para parecer bonito.
- Densidade deve combinar com o produto: dashboards e CRMs pedem leitura rapida; landing pages podem ser mais expressivas.
- Uma decisao visual forte por tela e suficiente.
- Evite cards dentro de cards, gradientes genericos, icones coloridos sem sistema, sombras pesadas e secoes com cara de template.
- Use espacamento em escala consistente, preferencialmente 4/8px.
- Preserve padroes existentes do projeto quando forem bons; corrija apenas o que prejudica clareza ou qualidade.
- Texto deve caber, escanear bem e nao competir com controles.

## Adaptacao De Visual Premium

Da referencia `docs/sites-premiados-tedson.md`, aproveite:

- controle de paleta;
- hierarquia tipografica;
- microdetalhes de hover/focus;
- ritmo de espacamento;
- acabamento de estados;
- uso intencional de imagem, icone ou ilustracao.

Adapte para projeto real:

- em produto operacional, prefira clareza, densidade e previsibilidade;
- em SaaS publico, use polish sem sacrificar conversao e legibilidade;
- em landing page, pode haver mais expressividade, mas ainda com foco e restraint;
- em mobile, reduza complexidade visual e priorize toque, leitura e performance.

## Handoff Modelo

```text
Visual Designer handoff:
- Direcao: [ex: SaaS operacional, limpo, denso, com acento verde apenas para acao primaria]
- Layout: [estrutura e hierarquia]
- Tokens: [cores, espacamento, radius, sombras, tipografia]
- Estados: [loading/empty/error/hover/focus/disabled]
- Evitar: [padroes genericos ou com cara de IA]
```
