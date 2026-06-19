# Task 04 - Dashboard

## Objetivo

Deixar o dashboard mais fiel ao frontend web e ao planejamento original.

## Estado atual

O dashboard existe, removeu conversas e usa cards com projetos, progresso, notificacoes e atividades. Ainda calcula dados a partir de projetos/notificacoes em vez de usar endpoints especificos.

## Escopo

- Criar service para dashboard, se o backend expuser endpoints proprios.
- Usar `GET /api/dashboard/stats` e `GET /api/dashboard/activity` ou equivalentes reais em portugues.
- Trocar o grafico manual por `fl_chart`.
- Exibir cards planejados:
  - Projetos ativos;
  - Inscricoes;
  - Notificacoes nao lidas;
  - Atividades recentes.
- Manter layout responsivo no celular.

## Requisitos de UI

- Nao quebrar em telas estreitas.
- Scroll vertical seguro.
- Cards com altura estavel.
- Grafico legivel em telas pequenas.

## Entregaveis

- `DashboardService` ou metodo equivalente em provider.
- Grafico com `fl_chart`.
- Dashboard baseado em dados reais do backend.

## Validacao

- `flutter analyze`
- Teste manual em celular ou emulador pequeno.
- Teste de widget para cards se possivel.
