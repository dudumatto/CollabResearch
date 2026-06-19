# Task 07 - Perfil e Configuracoes

## Objetivo

Finalizar detalhes de perfil e configuracoes para ficarem mais proximos do frontend web.

## Estado atual

Perfil ja possui edicao expandida. Configuracoes possuem voltar, salvar preferencias e alterar senha funcional. O fundo branco foi priorizado conforme decisao visual atual.

## Escopo

- Comparar campos do perfil mobile com o frontend web.
- Adicionar upload/troca de avatar se o backend suportar.
- Exibir estatisticas completas do usuario:
  - projetos;
  - inscricoes;
  - dados academicos relevantes.
- Revisar preferencias:
  - notificacoes;
  - tema, respeitando a decisao de fundo branco;
  - dados salvos localmente com `SharedPreferences` quando forem preferencias locais.
- Garantir que alterar senha valide campos antes de enviar.

## Entregaveis

- Perfil equivalente ao frontend dentro do possivel no mobile.
- Configuracoes com persistencia clara entre backend e local.
- Mensagens de erro/sucesso em portugues.

## Validacao

- `flutter analyze`
- Teste manual de salvar perfil.
- Teste manual de alterar senha.
