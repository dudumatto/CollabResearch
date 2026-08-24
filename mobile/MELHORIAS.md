# Melhorias planejadas do mobile

Este arquivo registra evolucoes que nao fazem parte da implementacao atual. A lista evita que ideias importantes se percam e deixa claro, para o TCC, o que ja funciona e o que depende de trabalho futuro.

## Prioridade alta

### Agenda (lista de prazos)

- Tratar a lista de prazos das etapas dos projetos como a **Agenda** do aplicativo.
- Criar uma tela propria com itens ordenados por data, separando proximos, concluidos e atrasados.
- Permitir acesso pela dashboard e, se fizer sentido no layout, pela navegacao principal.
- Reutilizar os prazos das etapas ja fornecidos pelo backend, sem manter uma segunda fonte de dados no mobile.

### Atividade recente

- Exibir uma secao de **Atividade recente** mesmo quando a lista estiver vazia, com estado vazio explicativo.
- Hoje a dashboard usa notificacoes recentes como aproximacao.
- No futuro, consolidar projetos, inscricoes, progresso, feedback e mensagens em uma linha do tempo quando o backend fornecer um endpoint de atividades.

## Melhorias de integracao

- Publicar notificacoes por um destino STOMP autenticado no backend e atualizar o `NotificationProvider` sem recarregar a tela. Atualmente apenas mensagens de chat possuem eventos em tempo real.
- Incluir a quantidade de mensagens nao lidas no retorno de conversas do backend. O mobile ja aceita esse campo, mas o contrato atual nao o envia.
- Adicionar paginacao ou carregamento incremental nas listas que podem crescer, principalmente projetos, notificacoes e mensagens.

## Melhorias de perfil e qualidade

- Implementar troca de avatar quando houver endpoint de upload definido no backend.
- Ampliar testes de widget para dashboard, filtros, inscricoes, notificacoes e perfil.
- Validar tambem em Android fisico ou emulador antes da entrega final do TCC.
