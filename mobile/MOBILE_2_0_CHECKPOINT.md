# CollabResearch Mobile 2.0 — checkpoint interrompido

Data do checkpoint: 2026-08-30.

O trabalho foi interrompido a pedido do usuário antes da conclusão da paridade funcional. Este arquivo registra o ponto exato para retomada sem ambiguidade.

## Concluído neste checkpoint

- Auditoria de `web/`, `mobile/`, contratos relevantes de `backend/` e vídeo de referência.
- Matriz de paridade levantada: Entregas, Avaliações, Agenda, Documentos, Orientandos e perfil de terceiros não existiam no Flutter.
- Direção visual definida a partir do vídeo: mobile-first, navegação inferior com cinco destinos, verde da marca, pouco relevo e cards acadêmicos.
- Tokens de spacing, radius e elevação adicionados.
- Paleta e tipografia do tema refinadas.
- Model `Project` ampliado para preservar requisitos, tecnologias, imagem e datas.
- Edição de projeto protegida contra apagar campos que antes não eram modelados pelo Flutter.
- Formulário de criação ampliado com requisitos, tecnologias, imagem e datas.
- Dependência `file_picker` adicionada para anexos reais de entregas.
- Models, endpoints, service e provider do workspace acadêmico criados.
- Telas de Agenda e Entregas implementadas em arquivos próprios.

## Ponto exato de parada

As telas abaixo existem, mas ainda **não foram conectadas ao GoRouter nem aos atalhos do Perfil/Projeto**:

- `lib/screens/agenda/agenda_screen.dart`
- `lib/screens/deliveries/deliveries_screen.dart`

O próximo passo planejado era criar a tela de Avaliações e depois conectar as novas rotas.

## Ainda não iniciado ou não concluído

- Tela e fluxo de Avaliações acadêmicas.
- Orientandos e detalhe do orientando.
- Perfil de terceiros.
- Documentos (listar/excluir é possível; upload binário depende da integração Supabase que o backend não oferece diretamente).
- Dashboard específico do ORIENTADOR usando `/api/orientador/dashboard`.
- Redesign final de Dashboard, Projetos, Detalhe do projeto, Chat, Notificações e Perfil.
- Correção completa do estado de inscrição atual e das confirmações de cancelar/aprovar/rejeitar.
- Rotas/deep links das novas áreas.
- Testes de widget específicos para os novos fluxos.
- Build Android: o ambiente atual não possui Android SDK.

## Regra para retomada

Continuar alterando somente `mobile/`. Não modificar `web/` nem `backend/`. Antes de retomar, executar `flutter analyze` e `flutter test` para confirmar que este checkpoint continua íntegro.
