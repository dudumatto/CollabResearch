# Análise de Segurança - Vulnerabilidade BOLA/IDOR no Módulo de Conversas

## 1. Escopo da Análise

### 1.1 Entidades Envolvidas

| Entidade | Arquivo | Tabela |
|----------|---------|--------|
| Conversa | `model/Conversa.java` | `conversa` |
| Mensagem | `model/Mensagem.java` | `mensagem` |
| ConversaParticipante | Relação ManyToMany em `Conversa.participantes` | `conversa_participantes` |
| Projeto | `model/Projeto.java` | `projeto` |
| Usuário | `model/Usuario.java` | `usuario` |
| TipoConversa | `model/TipoConversa.java` | Enum: GRUPO, PRIVADA |

### 1.2 Repositórios

| Repository | Arquivo |
|-----------|---------|
| ConversaRepository | `repository/ConversaRepository.java` |
| MensagemRepository | `repository/MensagemRepository.java` |
| ProjetoRepository | `repository/ProjetoRepository.java` |
| UsuarioRepository | `repository/UsuarioRepository.java` |
| InscricaoRepository | `repository/InscricaoRepository.java` |

### 1.3 Services

| Service | Arquivo |
|---------|---------|
| ConversaService | `service/ConversaService.java` |
| ChatRealtimeService | `service/ChatRealtimeService.java` |
| NotificacaoService | `service/NotificacaoService.java` |
| JwtService | `service/JwtService.java` |
| AuthHelper | `security/AuthHelper.java` |

### 1.4 Controllers

| Controller | Arquivo |
|-----------|---------|
| ConversaController | `controller/ConversaController.java` |

## 2. Autenticação (JWT)

### 2.1 Extração do Usuário Autenticado

- **Filtro**: `JwtAuthFilter.java` - intercepta requests, extrai email do token JWT, busca `Usuario` no banco
- **Filtro de autenticação**: `UsernamePasswordAuthenticationToken` com o objeto `Usuario` como principal
- **Helper**: `AuthHelper.getCurrentUser()` recupera o `Usuario` do `SecurityContextHolder`

### 2.2 Fluxo de Autenticação

```
Request → JwtAuthFilter → extrai email do JWT → busca Usuario no repository
→ valida token e revogação → cria UsernamePasswordAuthenticationToken
→ armazena no SecurityContextHolder
→ AuthHelper.getCurrentUser() recupera o Usuario
```

## 3. Rotas de Conversa

### 3.1 Endpoints Identificados

| Método | Rota | Descrição | Controller Method |
|--------|------|-----------|-------------------|
| POST | `/api/conversas` | Criar conversa por projeto | `criar()` |
| POST | `/api/conversas/projeto/{projetoId}/abrir` | Abrir/criar conversa por projeto | `abrirPorProjeto()` |
| GET | `/api/conversas/projeto/{projetoId}` | Buscar conversa por projeto | `buscarPorProjeto()` |
| POST | `/api/conversas/privada/{outroUsuarioId}` | Abrir conversa privada | `abrirPrivada()` |
| GET | `/api/conversas/{usuarioId}` | Listar conversas (grupo) | `listarConversas()` |
| GET | `/api/conversas` | Listar todas minhas conversas | `listarMinhasTodas()` |
| GET | `/api/conversas/{usuarioId}/todas` | Listar todas (grupo + privadas) | `listarTodas()` |
| GET | `/api/conversas/{usuarioId}/pagina` | Listar conversas paginadas | `listarConversasPaginadas()` |
| GET | `/api/conversas/{id}/mensagens` | Listar mensagens | `listarMensagens()` |
| GET | `/api/conversas/{id}/mensagens/pagina` | Mensagens paginadas | `listarMensagensPaginadas()` |
| POST | `/api/conversas/{id}/mensagem` | Enviar mensagem | `enviarMensagem()` |
| PUT | `/api/conversas/mensagem/{mensagemId}` | Editar mensagem | `editarMensagem()` |
| DELETE | `/api/conversas/mensagem/{mensagemId}` | Excluir mensagem | `excluirMensagem()` |

**Rotas alternativas (mobile/inglês):**
- `/api/chat/conversations` → alias de `/api/conversas`
- `/api/chat/conversations/{id}/messages` → alias de `/{id}/mensagens`

## 4. Mapeamento de Participação

### 4.1 Como Participantes São Armazenados

- **Conversas PRIVADA**: tabela `conversa_participantes` (ManyToMany com `Usuario`)
- **Conversas GRUPO**: participation derivada do `Projeto` associado

### 4.2 Validação de Participação para GRUPO

A validação verifica se o usuário é:
1. Orientador do projeto (`projeto.getOrientador().getUsuario().getId()`)
2. Aluno criador do projeto (`projeto.getAlunoCriador().getUsuario().getId()`)
3. Inscrito com status APROVADO no projeto (`inscricaoRepository.findByProjetoIdAndAlunoUsuarioId`)

### 4.3 Validação de Participação para PRIVADA

Verifica se o usuário está na lista `conversa.getParticipantes()`.

## 5. Vulnerabilidades Identificadas

### 5.1 VULN-01: `editarMensagem` - Ausência de Validação de Participação

**Localização**: `ConversaService.java:238-259`

**Problema**: Apenas verifica se o usuário é o remetente da mensagem. Não valida se o usuário participa da conversa.

**Impacto**: Um usuário não participante que obtenha o `mensagemId` pode editar a mensagem se for o remetente (cenário: usuário removido da conversa ainda pode editar mensagens antigas).

**Status**: PARCIAL - validação de remetente existe, mas falta validação de participação na conversa.

### 5.2 VULN-02: `excluirMensagem` - Ausência de Validação de Participação

**Localização**: `ConversaService.java:261-274`

**Problema**: Mesmo caso de VULN-01. Apenas verifica remetente, não participação.

**Impacto**: Usuário removido da conversa pode excluir mensagens antigas.

### 5.3 VULN-03: `listarConversasDoUsuario` (paginada) - Verificação Incompleta

**Localização**: `ConversaService.java:112-119`

**Problema**: A versão paginada apenas verifica orientador/alunoCriador, mas NÃO inclui inscritos aprovados.

**Impacto**: Funcional - inscritos aprovados não veem conversas na listagem paginada. Não é vulnerabilidade de segurança, mas é bug funcional que pode levar a bypass se o cliente usar apenas a versão paginada.

### 5.4 Ausência de Validação Centralizada com ID de Conversa

**Problema**: O método `validarParticipacao(Conversa, Integer)` exige que o objeto `Conversa` já esteja carregado. Não existe um método público que receba `conversaId` e `usuarioId` diretamente.

**Impacto**: Difícil reuso e consistência. Cada chamada precisa buscar a conversa primeiro.

## 6. Fluxos de Autenticação/Autorização por Endpoint

### 6.1 `listarMensagens` (GET /{id}/mensagens)
```
Controller → ConversaService.listarMensagens(id)
→ authHelper.getCurrentUser() [obtém usuário JWT]
→ conversaRepository.findById(conversaId)
→ validarParticipacao(conversa, usuarioLogado.getId())
  → PRIVADA: verifica participantes
  → GRUPO: validarParticipacaoProjeto(projeto, usuarioId)
→ Retorna mensagens ou 403
```
**Status**: VALIDADO ✓

### 6.2 `enviarMensagem` (POST /{id}/mensagem)
```
Controller → ConversaService.enviarMensagem(id, conteudo)
→ authHelper.getCurrentUser()
→ conversaRepository.findById(conversaId)
→ validarParticipacao(conversa, usuarioLogado.getId())
→ Salva mensagem
→ Notifica participantes
→ Publica via WebSocket
```
**Status**: VALIDADO ✓

### 6.3 `editarMensagem` (PUT /mensagem/{mensagemId})
```
Controller → ConversaService.editarMensagem(mensagemId, conteudo)
→ authHelper.getCurrentUser()
→ mensagemRepository.findById(mensagemId)
→ Verifica: mensagem.getRemetente().getId() == usuarioLogado.getId()
→ NÃO valida participação na conversa ⚠️
```
**Status**: VULNERÁVEL ⚠️

### 6.4 `excluirMensagem` (DELETE /mensagem/{mensagemId})
```
Controller → ConversaService.excluirMensagem(mensagemId)
→ authHelper.getCurrentUser()
→ mensagemRepository.findById(mensagemId)
→ Verifica: mensagem.getRemetente().getId() == usuarioLogado.getId()
→ NÃO valida participação na conversa ⚠️
```
**Status**: VULNERÁVEL ⚠️

## 7. Resumo

| Endpoint | Validação de Participação | Status |
|----------|--------------------------|--------|
| GET /{id}/mensagens | ✓ Chamando validarParticipacao | SEGURO |
| GET /{id}/mensagens/pagina | ✓ Chamando validarParticipacao | SEGURO |
| POST /{id}/mensagem | ✓ Chamando validarParticipacao | SEGURO |
| PUT /mensagem/{mensagemId} | ✗ Apenas verifica remetente | VULNERÁVEL |
| DELETE /mensagem/{mensagemId} | ✗ Apenas verifica remetente | VULNERÁVEL |
| POST / (criar) | ✓ Via abrirOuCriarPorProjeto | SEGURO |
| POST /projeto/{id}/abrir | ✓ validarParticipacaoProjeto | SEGURO |
| GET /projeto/{id} | ✓ validarParticipacaoProjeto | SEGURO |
| POST /privada/{id} | ✓ Cria/recupera conversa | SEGURO |
| GET /{usuarioId} | ✓ Verifica usuarioId == logado | SEGURO |
| GET / | ✓ Usa logadoId | SEGURO |
| GET /{usuarioId}/todas | ✓ Verifica usuarioId == logado | SEGURO |
| GET /{usuarioId}/pagina | ⚠️ Verificação parcial | FUNCIONAL BUG |

## 8. Arquivos Relevantes

- `ConversaService.java` - lógica principal de autorização
- `ConversaController.java` - endpoints REST
- `AuthHelper.java` - extração de usuário autenticado
- `JwtAuthFilter.java` - filtro de autenticação JWT
- `SecurityConfig.java` - configuração de segurança HTTP
- `ConversaRepository.java` - consultas de conversa
- `MensagemRepository.java` - consultas de mensagem
