# Testes E2E - CollabResearch

Esta pasta contém os testes end-to-end do projeto CollabResearch usando Playwright.

## Estrutura

```
e2e/
├── AGENTS.md              # Regras locais para agentes
├── setup/
│   └── auth.setup.ts      # Configuração de autenticação
├── auth/
│   └── login.spec.ts      # Testes de autenticação
├── pages/                 # Page Objects (quando necessário)
│   └── login.page.ts
├── fixtures/              # Fixtures personalizadas
│   └── test.ts
└── support/               # Utilitários de suporte
    ├── accounts.ts        # Leitura de credenciais
    ├── data-factory.ts    # Geração de dados únicos
    └── fixtures/          # Arquivos para upload
```

## Pré-requisitos

1. Node.js 18+ instalado
2. Dependências do nextweb instaladas (`npm install`)
3. Variáveis de ambiente configuradas (ver `.env.example`)

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do `nextweb` com:

```env
E2E_BASE_URL=http://127.0.0.1:3000
E2E_ALUNO_EMAIL=aluno@teste.com
E2E_ALUNO_PASSWORD=senha123
E2E_PROFESSOR_EMAIL=professor@teste.com
E2E_PROFESSOR_PASSWORD=senha123
E2E_ADMIN_EMAIL=admin@teste.com
E2E_ADMIN_PASSWORD=senha123
```

## Comandos

```bash
# Executar todos os testes
npm run test:e2e

# Executar com interface visual
npm run test:e2e:ui

# Executar em modo headed (visível)
npm run test:e2e:headed

# Executar em modo debug
npm run test:e2e:debug

# Abrir relatório HTML
npm run test:e2e:report
```

## Regras Importantes

1. **Isolamento**: Cada teste deve ser independente e executável em paralelo
2. **Locators**: Use `getByRole`, `getByLabel`, `getByText` ou `getByTestId`
3. **Assertions**: Use assertions web-first (`toBeVisible`, `toHaveText`, etc.)
4. **Dados**: Use contas e dados exclusivos por worker
5. **Cleanup**: Limpe dados via API de teste controlada

## Adicionando Novos Testes

1. Crie um novo arquivo `.spec.ts` no diretório do domínio
2. Use Page Objects para fluxos reutilizados
3. Mantenha testes curtos e focados em um cenário
4. Valide o efeito observável após cada ação importante

## CI/CD

Em CI, os testes são executados com:
- 2 workers
- 1 retry
- Trace no primeiro retry
- Screenshot apenas em falha
- Vídeo retido em falha

## Troubleshooting

### Teste falha com "Timeout exceeded"
- Verifique se a aplicação está rodando na porta correta
- Aumente o timeout se necessário (mas investigue a causa)

### Teste falha com "Element not found"
- Use o Trace Viewer para investigar
- Verifique se o locator está correto
- Considere usar `data-testid` se o elemento não tem contrato acessível

### Teste é "flaky"
- Nunca aumente timeout como solução
- Abra o trace e classifique a causa
- Corrija o teste, a aplicação ou os dados