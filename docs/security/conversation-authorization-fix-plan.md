# Plano de Correção - Vulnerabilidade BOLA/IDOR no Módulo de Conversas

## 1. Vulnerabilidade Identificada

### 1.1 BOLA/IDOR em `editarMensagem` e `excluirMensagem`

**Descrição**: Os endpoints `PUT /api/conversas/mensagem/{mensagemId}` e `DELETE /api/conversas/mensagem/{mensagemId}` verificam apenas se o usuário autenticado é o remetente da mensagem, mas NÃO validam se o usuário participa da conversa associada.

**Cenário de ataque**:
1. Usuário A participa da conversa 2 e envia mensagem M
2. Usuário A é removido da conversa 2
3. Usuário A ainda possui o `mensagemId` de M
4. Usuário A chama `PUT /api/conversas/mensagem/M` → 200 OK (edita mensagem)
5. Usuário A chama `DELETE /api/conversas/mensagem/M` → 204 (exclui mensagem)

**CVSS estimado**: 6.5 (Medium) - Violação de confidencialidade e integridade

### 1.2 Ausência de Método Centralizado de Validação

**Descrição**: Não existe um método público `validarParticipacao(conversaId, usuarioId)` que possa ser chamado diretamente com IDs, sem precisar carregar o objeto `Conversa` previamente.

## 2. Endpoints Afetados

| Endpoint | Método HTTP | Afetado |
|----------|-------------|---------|
| `/api/conversas/mensagem/{mensagemId}` | PUT | SIM - editarMensagem |
| `/api/conversas/mensagem/{mensagemId}` | DELETE | SIM - excluirMensagem |
| `/api/conversas/{id}/mensagens` | GET | NÃO - já validado |
| `/api/conversas/{id}/mensagens/pagina` | GET | NÃO - já validado |
| `/api/conversas/{id}/mensagem` | POST | NÃO - já validado |
| `/api/conversas` | POST | NÃO - já validado |
| `/api/conversas/projeto/{projetoId}/abrir` | POST | NÃO - já validado |
| `/api/conversas/privada/{outroUsuarioId}` | POST | NÃO - já validado |
| `/api/conversas/{usuarioId}` | GET | NÃO - já validado |
| `/api/conversas` | GET | NÃO - já validado |
| `/api/conversas/{usuarioId}/todas` | GET | NÃO - já validado |
| `/api/conversas/{usuarioId}/pagina` | GET | PARCIAL - bug funcional |

## 3. Estratégia de Correção

### 3.1 Criar Método Centralizado

Adicionar método público na `ConversaService`:

```java
public void validarParticipacao(Integer conversaId, Integer usuarioId) {
    Conversa conversa = conversaRepository.findById(conversaId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
    validarParticipacao(conversa, usuarioId);
}
```

Este método:
- Busca a conversa por ID
- Delega para a validação existente `validarParticipacao(Conversa, Integer)`
- Lança 404 se conversa não encontrada
- Lança 403 se usuário não participa

### 3.2 Corrigir `editarMensagem`

Adicionar chamada a `validarParticipacao` antes da verificação de remetente:

```java
public MensagemResponse editarMensagem(Integer mensagemId, String novoConteudo) {
    Usuario usuarioLogado = authHelper.getCurrentUser();
    Mensagem mensagem = mensagemRepository.findById(mensagemId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Mensagem nao encontrada"));

    // NOVO: Validar participação na conversa
    if (mensagem.getConversa() != null) {
        validarParticipacao(mensagem.getConversa().getId(), usuarioLogado.getId());
    }

    // Verificação existente: apenas remetente pode editar
    if (!mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Voce nao pode editar a mensagem de outro usuario");
    }
    // ... resto do método
}
```

### 3.3 Corrigir `excluirMensagem`

Mesmo padrão:

```java
public void excluirMensagem(Integer mensagemId) {
    Usuario usuarioLogado = authHelper.getCurrentUser();
    Mensagem mensagem = mensagemRepository.findById(mensagemId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Mensagem nao encontrada"));

    // NOVO: Validar participação na conversa
    if (mensagem.getConversa() != null) {
        validarParticipacao(mensagem.getConversa().getId(), usuarioLogado.getId());
    }

    // Verificação existente: apenas remetente pode excluir
    if (!mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Voce nao pode excluir a mensagem de outro usuario");
    }
    // ... resto do método
}
```

### 3.4 Corrigir `listarConversasDoUsuario` (paginada)

Unificar a lógica paginada com a não paginada para incluir inscritos aprovados:

```java
public Page<Conversa> listarConversasDoUsuario(Integer usuarioId, Pageable pageable) {
    Usuario usuarioLogado = authHelper.getCurrentUser();
    if (!usuarioLogado.getId().equals(usuarioId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Sem permissao para listar conversas de outro usuario");
    }

    // Usar a query unificada que inclui inscritos
    return conversaRepository.findByProjetoInParticipacao(usuarioId, pageable);
}
```

Ou alternativamente, adicionar query no repository:

```java
@Query("""
    SELECT c FROM Conversa c
    LEFT JOIN c.projeto p
    LEFT JOIN p.orientador o
    LEFT JOIN p.alunoCriador ac
    LEFT JOIN Inscricao i ON i.projeto = p AND i.aluno.usuario.id = :usuarioId AND i.status = 'APROVADO'
    WHERE (o.usuario.id = :usuarioId OR ac.usuario.id = :usuarioId OR i IS NOT NULL)
""")
Page<Conversa> findByParticipacaoDoUsuario(@Param("usuarioId") Integer usuarioId, Pageable pageable);
```

## 4. Impacto Esperado

### 4.1 Segurança
- Elimina vulnerabilidade BOLA/IDOR em editar/excluir mensagem
- Todas as operações de leitura e escrita passam a validar participação
- Método centralizado facilita manutenção e auditoria

### 4.2 Performance
- Impacto mínimo: apenas 2 queries adicionais (buscar mensagem + validar participação)
- A validação de participação já é feita em outros endpoints, usando índices existentes

### 4.3 Compatibilidade
- Nenhuma mudança na API (mesmos códigos de retorno)
- Nenhuma mudança no banco de dados
- Nenhuma mudança no contrato JSON
- Nenhuma mudança em regras de negócio além da autorização

## 5. Casos de Teste Necessários

### 5.1 `editarMensagem`
- [ ] Participante da conversa → permite edição (200 OK)
- [ ] Não participante → 403 Forbidden
- [ ] Mensagem inexistente → 404 Not Found
- [ ] Conteúdo vazio → 400 Bad Request

### 5.2 `excluirMensagem`
- [ ] Participante da conversa → permite exclusão (204 No Content)
- [ ] Não participante → 403 Forbidden
- [ ] Mensagem inexistente → 404 Not Found

### 5.3 `listarMensagens` (já validado)
- [ ] Participante → 200 OK
- [ ] Não participante → 403 Forbidden
- [ ] Conversa inexistente → 404 Not Found

### 5.4 `enviarMensagem` (já validado)
- [ ] Participante → 201 Created
- [ ] Não participante → 403 Forbidden
- [ ] Conversa inexistente → 404 Not Found

### 5.5 `listarConversasDoUsuario` (paginada)
- [ ] Inscrito aprovado vê conversas do projeto → 200 OK

### 5.6 Cenários Gerais
- [ ] JWT inválido → 401 Unauthorized
- [ ] Conversa inexistente → 404 Not Found
- [ ] Conversa privada: não participante → 403 Forbidden
- [ ] Conversa grupo: não participante do projeto → 403 Forbidden

## 6. Arquivos a Alterar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `ConversaService.java` | Adicionar método centralizado + corrigir editarMensagem/excluirMensagem |
| `ConversaRepository.java` | Adicionar query para listagem paginada unificada (opcional) |
| `ConversaServiceTest.java` | Adicionar testes unitários de autorização |
| `ConversaControllerIntegrationTest.java` | Adicionar testes de integração de autorização |

## 7. Ordem de Implementação

1. Adicionar método `validarParticipacao(Integer, Integer)` na `ConversaService`
2. Corrigir `editarMensagem` - adicionar validação de participação
3. Corrigir `excluirMensagem` - adicionar validação de participação
4. Corrigir `listarConversasDoUsuario` paginada - incluir inscritos aprovados
5. Adicionar testes unitários no `ConversaServiceTest`
6. Adicionar testes de integração no `ConversaControllerIntegrationTest`
7. Executar build completo
8. Gerar relatório final
