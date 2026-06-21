# Regra Anti-Cara-De-IA Para UI

Use esta regra em toda tarefa de frontend com impacto visual.

## Objetivo

Interfaces devem parecer produto real: especificas, consistentes, responsivas e uteis. Nao devem parecer template gerado automaticamente.

## Diretrizes

- Comece pela tarefa do usuario, nao pela estetica.
- Escolha densidade visual de acordo com o dominio.
- Preserve padroes bons do projeto existente.
- Use uma paleta controlada e tokens consistentes.
- Prefira poucos elementos bem resolvidos a muitas secoes decorativas.
- De tratamento real a estados de loading, empty, error, disabled, hover e focus.
- Use imagens, icones e animacoes somente quando ajudam entendimento, confianca ou acao.
- Evite texto generico. Microcopy deve refletir o produto e o fluxo.
- Teste visualmente mobile e desktop quando a mudanca for relevante.

## Heuristica Por Tipo De Produto

- Dashboard, CRM, admin e sistema interno: densidade, tabelas claras, filtros previsiveis, estados robustos, pouco efeito.
- SaaS publico: clareza comercial, UI polida, componente de produto visivel, CTA sem exagero.
- Landing page: mais expressiva, mas com uma ideia visual central e sem excesso.
- App mobile: toque, leitura, hierarquia curta, areas clicaveis confortaveis.

## Padroes A Evitar

- Cards dentro de cards.
- Gradientes genericos como principal identidade.
- Layout com espacamento gigante sem funcao.
- Icones multicoloridos sem regra.
- Sombras pesadas e radius aleatorio.
- Copy vaga: "solucoes inovadoras", "experiencia completa", "potencialize seu negocio" sem contexto.
- Animacoes pesadas em mobile.

## Criterio Final

Antes de entregar, pergunte:

```text
Esta tela parece ter sido desenhada para este produto especifico, ou poderia estar em qualquer template?
```

Se poderia estar em qualquer template, use `visual-designer` novamente ou ajuste a implementacao antes de finalizar.
