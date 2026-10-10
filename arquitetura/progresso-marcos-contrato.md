# Contrato: progresso por marcos com checklist

Fonte única de verdade entre o agente FUNCIONAL (backend + camada de dados do web) e o agente VISUAL (páginas, componentes, CSS).
Se precisar mudar algo aqui, atualize este arquivo e avise no relatório final. Não renomeie campos sem registrar.

## Modelo

- **Marco** = `EtapaProgresso` existente (`progress_steps`). Reaproveitar a entidade; não criar entidade nova para marco.
- **Tarefa** = nova entidade filha do marco (tabela nova, migração `V12__marcos_checklist.sql`), com:
  `id, titulo, obrigatoria, origem (ORIENTADOR|ALUNO), concluida, concluidaEm, concluidaPor, ordem, criadaPor`.
- Tarefa `ORIENTADOR`: só o orientador cria/edita/remove/reordena/altera `obrigatoria`; o aluno só marca/desmarca `concluida`.
- Tarefa `ALUNO` (pessoal): o aluno cria/edita/remove/marca; nunca é obrigatória; o orientador só visualiza.
- Migração preserva dados: cada marco existente com status `DONE` ganha 1 tarefa `ORIENTADOR` concluída com o título do marco; os demais ganham 1 tarefa pendente com o título do marco (marco nunca fica "vazio" por causa da migração).

## Regras de cálculo (somente no backend; web usa o que vem pronto)

- `percentual` do marco = `round(itensConcluidos / itensTotal * 100)`. Itens = todas as tarefas (orientador + pessoais). Marco sem tarefas: `itensTotal=0`, `percentual=0`, `semTarefas=true`.
- Progresso geral do projeto = soma de itens concluídos / soma de itens totais de todos os marcos (mesma base dos marcos, sem divergência). Projeto sem marcos: `percentualGeral=0`, `marcosTotal=0`.
- Vários marcos podem estar em andamento ao mesmo tempo (remover a restrição de uma única etapa `ACTIVE`).
- Percentual e estado de revisão são independentes: 100% não aprova sozinho.
- Tarefas obrigatórias: marco só pode ser enviado para revisão com todas as obrigatórias concluídas.

## Estado do marco (sem status novos)

Reaproveitar `EtapaProgressoStatus`, com o significado:
`PENDING` = não iniciado (0 itens) / `ACTIVE` = em andamento (≥1 item concluído, ainda não enviado) / `DONE` = aprovado pelo orientador / `REJECTED` = devolvido para ajustes.
Campo derivado `emRevisao` (boolean) = enviado pelo aluno e aguardando decisão do orientador (usar coluna `submitted_at` em `progress_steps`; limpa ao aprovar/devolver).
Histórico de revisões: tabela nova `progress_step_reviews` (`id, etapaId, acao APROVADO|DEVOLVIDO|ENVIADO, comentario, autorId, criadoEm`), nunca apagada ao devolver/reaprovar.

## DTOs (JSON)

Marco (`EtapaResponse`, campos novos em negrito no código):
```
{ id, projetoId, titulo, descricao, ordem, prazo, status, emRevisao,
  itensConcluidos, itensTotal, percentual, semTarefas,
  tarefas: [ { id, titulo, obrigatoria, origem, concluida, concluidaEm, ordem } ],
  ultimaRevisao: { acao, comentario, autorNome, criadoEm } | null }
```
Resumo do projeto (`ProjectProgressResponse`, manter campos atuais e acrescentar):
```
{ percentualGeral, itensConcluidos, itensTotal, marcosTotal, marcosConcluidos, marcosEmRevisao, marcosComAtencao, atualizacoesTotal }
```
`marcosComAtencao` = marcos `REJECTED` ou com prazo vencido e não `DONE`.

## Endpoints (prefixo `/api/projetos/{id}/etapas`; manter os existentes)

| Método | Rota | Quem | Efeito |
|---|---|---|---|
| GET | `` | ambos | lista marcos já com tarefas e contagens |
| POST/PUT/DELETE | `` e `/{etapaId}` | orientador | CRUD de marco (existente) |
| PUT | `/ordem` body `{ids:[...]}` | orientador (aluno só se a regra atual permitir) | reordena marcos |
| POST | `/{etapaId}/tarefas` body `{titulo, obrigatoria?}` | ambos | origem derivada do papel |
| PATCH | `/{etapaId}/tarefas/{tarefaId}` body `{titulo?, obrigatoria?, concluida?}` | conforme origem | edita / conclui / reabre |
| DELETE | `/{etapaId}/tarefas/{tarefaId}` | conforme origem | remove |
| PUT | `/{etapaId}/tarefas/ordem` body `{ids:[...]}` | dono das tarefas | reordena |
| POST | `/{etapaId}/enviar-revisao` | aluno | marca `emRevisao` |
| POST | `/{etapaId}/revisao` body `{acao:"APROVAR"|"DEVOLVER", comentario}` | orientador | comentário obrigatório ao devolver |
| GET | `/{etapaId}/revisoes` | ambos | histórico |

Atualizações narrativas (`criarAtualizacao` / feed) permanecem independentes do checklist: não concluem nem reabrem tarefas.

## Camada web (dono: FUNCIONAL) — `web/src/app/services/progressService.js`, `web/src/app/utils/adapters.js`

Funções exportadas que o visual deve consumir (retornam objetos já normalizados no formato dos DTOs acima):
`getProgressSummary(projectId)`, `listMarcos(projectId)`, `createMarco`, `updateMarco`, `deleteMarco`, `reorderMarcos(projectId, ids)`,
`createTarefa(projectId, marcoId, {titulo, obrigatoria})`, `updateTarefa(projectId, marcoId, tarefaId, patch)`, `toggleTarefa(projectId, marcoId, tarefaId, concluida)`,
`deleteTarefa`, `reorderTarefas`, `submitMarcoForReview(projectId, marcoId)`, `reviewMarco(projectId, marcoId, {acao, comentario})`, `listRevisoes(projectId, marcoId)`.
Se algum nome já existir no arquivo, manter o existente e ajustar este contrato.

## Divisão de arquivos

- **FUNCIONAL**: `backend/**`, `supabase/**` se houver schema duplicado, `web/src/app/services/**`, `web/src/app/utils/**`, testes (JUnit e Vitest/e2e mock helpers de dados), seed `dev_seed.sql`.
- **VISUAL**: `web/src/app/pages/ProgressPage.jsx`, `AdvisorProgressPage.jsx`, `AdvisorAdviseeDetailPage.jsx` (trecho de etapas), `web/src/app/components/progress/**`, CSS correspondente (`AdvisorWorkspace.css`, CSS de progress), textos e acessibilidade.
- Arquivo fora da sua lista: não edite; peça no relatório.
- Ninguém faz commit, push nem deploy.

## Divergências e decisões do agente FUNCIONAL (implementado)

- Respostas: POST/PATCH/DELETE de tarefa, `PUT /{etapaId}/tarefas/ordem`, `enviar-revisao` e `revisao` devolvem o **marco atualizado** (`EtapaResponse`; POST tarefa = 201). `PUT /ordem` devolve a lista de marcos. `DELETE` de tarefa devolve 200 + marco (não 204). `DELETE` de marco segue 204.
- Campos extras (aditivos): tarefa tem `criadaPorId`/`criadaPorNome` (para saber se a tarefa pessoal é do usuário); marco tem `enviadaEm`; revisão tem `id`, `autorId`. `peso` continua no JSON por compatibilidade, mas não entra em nenhum cálculo.
- `ultimaRevisao` = última **decisão** (APROVADO/DEVOLVIDO); `ENVIADO` só aparece em `GET .../revisoes` (mais recente primeiro). Revisão sempre traz `autorNome`.
- Resumo `GET /api/projects/{id}/progress` mantém `overallPercent` (= `percentualGeral`), `steps` e `updates`, e acrescenta os campos do contrato + `marcos` (lista completa de `EtapaResponse`). `steps[]` ganhou `emRevisao`, `itensConcluidos`, `itensTotal`, `percentual`, `prazo`.
- Checklist somente leitura quando o marco está **aprovado (DONE) ou em revisão**: criar/editar/remover/reordenar/marcar tarefa devolve 409 para todos os papéis (orientador precisa devolver o marco para editar). Enviar/revisar também dão 409 em marco DONE.
- Tarefa do orientador: qualquer participante (aluno ou orientador) marca/desmarca; só o orientador edita título/obrigatoriedade, remove e reordena. Tarefa pessoal (ALUNO): só o aluno que a criou mexe em tudo; aluno envia `obrigatoria=true` → 400 (também na criação). Reordenar tarefas: `ids` deve ser exatamente o conjunto que o usuário gerencia (as dos outros mantêm a posição).
- Revisão: `APROVAR`/`DEVOLVER` exigem marco em revisão (409 se não); `DEVOLVER` exige comentário (400); `APROVAR` e `enviar-revisao` exigem todas as tarefas obrigatórias concluídas (409). Devolvido = `REJECTED` com `emRevisao=false`; reenviar volta a `ACTIVE`. Marco sem tarefas pode ser enviado.
- Estado derivado: `PENDING`/`ACTIVE` seguem os itens concluídos (0 → PENDING, ≥1 → ACTIVE); `REJECTED` só sai com novo envio; `DONE` só por aprovação.
- Conclusão legada (`PATCH .../etapas/{id}` e `PATCH .../steps/{id}`, `{status:"done"}`) agora equivale a **aprovar** e só funciona para o orientador responsável (aluno recebe 403; deve usar `enviar-revisao`). Mesma exigência de obrigatórias concluídas.
- Listar marcos/resumo/calendário **não cria mais marcos padrão** implicitamente (projeto sem marcos retorna lista vazia / zeros); os 6 marcos padrão continuam sendo criados na criação do projeto, todos `PENDING`, sem tarefas.
- `PUT /etapas/ordem` (marcos): só o orientador responsável; `ids` exatamente igual ao conjunto de marcos do projeto. Excluir marco renumera `ordem` dos restantes; tarefas e histórico saem em cascata (marco `DONE` não pode ser excluído, como antes).
- Web: `progressService` exporta as 14 funções do contrato como named exports e também dentro do objeto `progressService`; `getProgress` (legado) continua para Dashboard/hook. Mappers: `mapMarco`, `mapTarefa`, `mapRevisao` em `utils/adapters.js`; textos em `utils/progressFormat.js` (`formatItensConcluidos`, `formatPercentual`).
