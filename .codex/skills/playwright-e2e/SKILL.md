---
name: playwright-e2e
description: Planeje, implemente, revise e depure testes end-to-end estáveis com Playwright para páginas, formulários, botões, autenticação, navegação, uploads e fluxos críticos de interface. Use para testes funcionais de UI; não use para benchmarks de performance.
---

# Playwright E2E — padrão do projeto

## Objetivo

Produzir testes E2E que representem jornadas reais do usuário e detectem regressões funcionais sem ficarem frágeis a mudanças cosméticas. O teste deve ser legível como uma especificação de comportamento e confiável tanto localmente quanto no CI.

## Antes de escrever qualquer teste

1. Leia `package.json`, o framework, scripts existentes, configuração Playwright, rotas, layout, autenticação e testes próximos ao fluxo.
2. Descubra o contrato do usuário: quem usa, ponto de entrada, pré-condição, ação, resultado visível e estado persistido.
3. Verifique de onde virão dados de teste e como serão limpos. Não use banco de produção, usuário pessoal nem dados criados manualmente.
4. Decida o nível correto: E2E para jornada entre camadas; teste de componente/unitário para regra isolada. Não transforme toda validação pequena em E2E.

## Estrutura padrão

```text
nextweb/
├─ playwright.config.ts
├─ playwright/
│  └─ .auth/                     # ignorado pelo Git
└─ e2e/
   ├─ AGENTS.md                  # regras locais resumidas
   ├─ setup/
   │  └─ auth.setup.ts            # cria storageState de contas de teste
   ├─ auth/
   │  └─ login.spec.ts
   ├─ perfil/
   │  └─ editar-perfil.spec.ts
   ├─ documentos/
   │  └─ enviar-documento.spec.ts
   ├─ pages/                      # somente fluxos reutilizados/complexos
   │  ├─ login.page.ts
   │  └─ perfil.page.ts
   ├─ fixtures/
   │  └─ test.ts                  # fixtures tipadas do projeto
   ├─ support/
   │  ├─ accounts.ts              # leitura segura de contas E2E/env
   │  ├─ data-factory.ts          # dados únicos e determinísticos
   │  ├─ api-client.ts            # seed/cleanup, se a API permitir
   │  └─ files.ts                 # fixtures de upload não sensíveis
   └─ performance/                # exclusivamente benchmark manual
```

Organize specs por domínio do produto, não por tipo de seletor ou por tela genérica. Não crie `helpers.ts` gigante: todo helper deve ter responsabilidade específica.

## Contratos de seleção

Escolha locators pelo que o usuário e tecnologias assistivas percebem:

1. `page.getByRole(role, { name })` — padrão para botões, links, headings, diálogos, tabs e inputs com papel acessível.
2. `page.getByLabel()` — inputs e selects com label.
3. `page.getByPlaceholder()` — somente quando placeholder é contrato real de UI.
4. `page.getByText()` — mensagens, títulos e conteúdo que o usuário lê.
5. `page.getByTestId()` — quando a UI não oferece contrato acessível estável ou existe ambiguidade legítima.

Nunca use `page.locator('.classe')`, XPath, caminhos DOM, `nth-child`, `.first()` para fugir de ambiguidade, `ElementHandle` ou `waitForSelector` como padrão. Quando um locator encontra vários elementos, refine-o com papel, nome, container semântico ou um `data-testid` específico.

### Exemplo correto

```ts
await page.getByLabel('E-mail').fill(account.email)
await page.getByLabel('Senha').fill(account.password)
await page.getByRole('button', { name: 'Entrar' }).click()

await expect(page).toHaveURL(/\/inicio$/)
await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
```

### Exemplo incorreto

```ts
await page.locator('.btn-primary').nth(0).click()
await page.waitForTimeout(2_000)
expect(await page.locator('.toast').textContent()).toContain('ok')
```

## Arquitetura do teste

### Spec

Cada spec deve ser curta e contar uma história. Use nomes que descrevem ator, ação e resultado:

```ts
test('aluno autenticado atualiza a biografia e vê a alteração após recarregar', async ({ page }) => {
  // Arrange: preparar cenário mínimo
  // Act: executar uma intenção do usuário
  // Assert: provar resultado observável e persistência
})
```

Evite um único teste de "fluxo completo" com login, cadastro, edição, upload, exclusão e logout. Divida por resultado e mantenha cada cenário independente.

### Page Objects

Use Page Objects apenas quando um fluxo/tela for reutilizado por pelo menos dois specs ou for complexo o suficiente para esconder detalhes repetitivos. Page Objects não devem conter assertions de negócio, dados globais ou esperas arbitrárias.

```ts
export class PerfilPage {
  constructor(private readonly page: Page) {}

  async abrir() {
    await this.page.goto('/perfil')
  }

  async salvarBiografia(texto: string) {
    await this.page.getByLabel('Biografia').fill(texto)
    await this.page.getByRole('button', { name: 'Salvar alterações' }).click()
  }
}
```

As assertions continuam preferencialmente no spec, porque ele deve evidenciar o contrato testado.

### Fixtures e dados

- Use fixtures para entregar somente o que cada teste precisa: página autenticada, usuário de teste, API de seed, Page Object.
- Para testes paralelos que gravam no servidor, gere dados únicos (`testInfo.workerIndex`, UUID/sufixo) ou use uma conta por worker.
- Faça cleanup via API ou banco de teste controlado; não execute limpeza destrutiva ampla sem confirmação explícita.
- Para upload, mantenha arquivos pequenos, fictícios e versionados em `e2e/support/fixtures/`.

## Autenticação

Use um projeto de setup que gera `storageState` para contas E2E. Coloque os arquivos de sessão em `playwright/.auth/` e adicione a pasta ao `.gitignore`. Não reutilize a mesma conta se os testes alteram estado de servidor em paralelo.

```ts
// e2e/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test'
import path from 'node:path'

const authFile = path.join(process.cwd(), 'playwright/.auth/aluno.json')

setup('autentica conta de aluno para E2E', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(process.env.E2E_ALUNO_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.E2E_ALUNO_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/(inicio|dashboard)$/)
  await page.context().storageState({ path: authFile })
})
```

## Assertions e sincronização

- Após cada ação importante, valide o efeito que importa: URL, heading, toast, valor salvo, item listado, botão habilitado, download iniciado, estado persistido após `page.reload()`.
- Deixe o auto-waiting do Playwright trabalhar. `expect(locator)` faz retry para estados web-first.
- Não use `waitForTimeout`. Espere por um estado de UI, response controlada, navegação ou evento explicitamente relevante.
- Use `expect.poll` somente para estado assíncrono externo inevitável, com motivo documentado.

## Configuração recomendada

Adapte scripts, porta e browser ao projeto real antes de criar o arquivo. Esta é uma referência de qualidade, não um arquivo para colar sem revisar:

```ts
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['performance/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/aluno.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

Para um smoke rápido de PR, rode Chromium. Adicione Firefox/WebKit e viewport mobile em uma rotina separada, nightly ou antes de release, depois que o núcleo estiver estável.

## Scripts esperados

Ajuste para o package manager real e documente no `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Matriz de cobertura inicial para o TCC

Priorize jornadas que mudam dados ou bloqueiam o uso do sistema:

1. Login válido, login inválido e acesso bloqueado de rota protegida.
2. Navegação principal por papel de usuário.
3. Edição de perfil, feedback de sucesso e persistência depois de recarregar.
4. Upload de documento: selecionar arquivo, enviar, feedback e item acessível depois do envio.
5. Ações críticas de listagem/detalhe (abrir, filtrar, editar ou concluir conforme existir no produto).
6. Estados de erro mais prováveis: validação do formulário, sessão expirada e erro controlado do backend.

Não comece por testes visuais extensos nem tente cobrir todo o sistema. Primeiro estabilize esses fluxos críticos.

## Evidências e CI

- Em CI: trace no primeiro retry, screenshot somente em falha e vídeo retido em falha.
- Versione apenas código, fixtures fictícias e documentação. Ignore `playwright/.auth/`, `playwright-report/`, `test-results/` e artefatos temporários.
- Todo teste novo deve passar sozinho e junto da suíte do domínio.
- Não aceite "flaky" sem causa. Abra trace e classifique a falha antes de decidir entre corrigir produto, testabilidade, dado, ambiente ou teste.

## Checklist de revisão

- [ ] O nome do teste descreve um resultado de usuário.
- [ ] O teste pode rodar isolado e em paralelo.
- [ ] Dados, conta e cleanup são controlados.
- [ ] Locators são acessíveis ou `data-testid` explícitos.
- [ ] Não há sleep, CSS frágil, XPath ou dependência de outro teste.
- [ ] Cada interação importante tem assertion do efeito observável.
- [ ] O teste falho gera trace/screenshot/vídeo útil.
- [ ] O benchmark de performance, se existir, está fora deste fluxo.
