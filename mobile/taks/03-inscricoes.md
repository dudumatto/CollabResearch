# Task 03 - Inscricoes

## Objetivo

Completar o fluxo de inscricoes para aluno e dono/orientador do projeto.

## Escopo

- Criar ou completar `models/subscription.dart`.
- Revisar `services/subscription_service.dart`.
- Completar `screens/subscriptions/subscriptions_screen.dart`.
- Adicionar acoes:
  - listar minhas inscricoes;
  - cancelar inscricao pendente;
  - listar inscricoes recebidas por projeto;
  - aprovar inscricao;
  - rejeitar inscricao.
- Integrar inscricoes pendentes no detalhe do projeto quando o usuario for dono/orientador.

## Requisitos de UI

- Badges: pendente amarelo, aprovado verde, rejeitado vermelho.
- Loading, erro e vazio.
- Confirmacao antes de cancelar, aprovar ou rejeitar.

## Entregaveis

- Fluxo de inscricao completo.
- Acoes protegidas por permissao visual no mobile.
- Services sem chamadas HTTP diretas fora do `ApiClient`.

## Validacao

- `flutter analyze`
- Teste manual de listar, aprovar, rejeitar e cancelar.
- Widget test para card/item de inscricao se for criado.
