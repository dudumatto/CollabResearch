# Task 05 - Projetos

## Objetivo

Completar os fluxos de projeto alem da listagem e filtros ja existentes.

## Estado atual

Projetos possuem listagem, busca, filtros por status/area/curso e status formatado como `Em andamento`. O detalhe ainda precisa de fluxos mais completos.

## Escopo

- Revisar `ProjectDetailScreen`.
- Adicionar secoes ou tabs:
  - informacoes gerais;
  - colaboradores;
  - progresso;
  - inscricoes pendentes para dono/orientador.
- Implementar acoes conforme permissao:
  - inscrever-se;
  - editar;
  - excluir;
  - aceitar/rejeitar orientacao ou inscricao, conforme regra do backend;
  - remover colaborador.
- Adicionar paginacao ou botao "carregar mais" na listagem.
- Garantir filtros sem quebrar layout mobile.

## Entregaveis

- Detalhe de projeto completo.
- Listagem com paginacao ou carregamento incremental.
- Acoes condicionais por papel do usuario.

## Validacao

- `flutter analyze`
- Teste manual de criar, editar, listar, filtrar e abrir detalhe.
- Widget test para `ProjectCard` deve continuar passando.
