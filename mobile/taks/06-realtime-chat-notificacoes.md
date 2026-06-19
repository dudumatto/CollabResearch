# Task 06 - Real-time, Chat e Notificacoes

## Objetivo

Integrar WebSocket STOMP de ponta a ponta com chat e notificacoes.

## Escopo

- Revisar `services/stomp_service.dart`.
- Conectar STOMP somente apos login.
- Desconectar STOMP no logout.
- Integrar mensagens recebidas ao `ChatProvider`.
- Integrar notificacoes recebidas ao `NotificationProvider`.
- Adicionar badge de nao lidas no BottomNavigationBar.
- Completar chat:
  - badge de conversas nao lidas;
  - FAB para iniciar conversa;
  - long press em mensagens proprias para editar/excluir, se backend suportar.
- Completar notificacoes:
  - marcar uma notificacao como lida;
  - marcar todas como lidas;
  - tempo relativo;
  - visual diferente para lida/nao lida.

## Entregaveis

- STOMP conectado com auth.
- Providers atualizando UI em tempo real.
- Badges sincronizados.

## Validacao

- `flutter analyze`
- Teste manual com dois usuarios quando possivel.
- Teste manual de receber notificacao sem recarregar tela.
