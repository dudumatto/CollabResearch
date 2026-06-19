# Task 08 - Testes e Validacao

## Objetivo

Atualizar a suite de testes para refletir a UI atual e evitar regressao nos fluxos principais.

## Contexto

Ja existem testes para login, `ProjectCard`, `MessageBubble`, JWT e contratos de modelo. A suite completa ja teve testes antigos quebrando por expectativas desatualizadas de UI.

## Escopo

- Rodar a suite completa com `flutter test`.
- Atualizar testes antigos sem reduzir cobertura.
- Adicionar testes focados para:
  - dashboard responsivo;
  - filtros de projetos;
  - inscricoes;
  - progresso;
  - notificacoes;
  - configuracoes/alterar senha.
- Manter testes de widget pequenos e deterministas.

## Entregaveis

- `flutter test` passando.
- `flutter analyze` passando.
- Lista de fluxos manuais validados em celular/emulador.

## Validacao

- `flutter analyze`
- `flutter test`
- Teste manual em tela pequena para login, dashboard, projetos e configuracoes.
