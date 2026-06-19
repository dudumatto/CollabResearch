# Task 02 - Progresso

## Objetivo

Implementar progresso real no mobile, incluindo tela propria, modelo, service e integracao com dashboard/projetos.

## Escopo

- Criar ou completar `models/progress.dart`.
- Criar ou completar `services/progress_service.dart`.
- Implementar `screens/progress/progress_screen.dart`.
- Exibir progresso no detalhe do projeto.
- Substituir progresso estimado por dados reais quando o backend fornecer.

## Requisitos de UI

- Estado de carregamento.
- Estado vazio.
- Estado de erro com mensagem em portugues.
- Indicadores visuais de progresso por projeto.
- Usar a paleta atual com fundo branco.

## Entregaveis

- Tela de progresso funcional.
- Integracao com `ProjectDetailScreen`.
- Dashboard lendo progresso real ou fallback bem definido.

## Validacao

- `flutter analyze`
- Widget test simples para estado vazio ou card de progresso.
- Teste manual abrindo `/progress` e detalhe de projeto.
