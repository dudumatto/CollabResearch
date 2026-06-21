---
name: playwright-performance
description: Crie, revise ou execute benchmarks manuais de performance com Playwright para interações de interface, medindo tempos e coletando artefatos sem misturar performance com a suíte E2E funcional ou com o CI padrão.
---

# Playwright Performance — benchmark manual do projeto

## Objetivo

Usar Playwright para medir regressões de performance em interações importantes, sem transformar testes funcionais em benchmarks instáveis. Esta skill é inspirada em suítes de performance maduras: cenário controlado, build de produção, execução serial, métricas estruturadas e análise por tendência.

## Quando usar

Use apenas quando o pedido mencionar desempenho, lentidão, tempo de carregamento, renderização, navegação, repaint, interação pesada, long tasks, trace do Chrome ou benchmark manual.

Não use para validar se um botão funciona, se um formulário salva ou se uma tela aparece. Esses casos pertencem à skill `playwright-e2e`.

## Regras de separação

- Benchmarks ficam em `nextweb/e2e/performance/`.
- Nunca devem entrar no comando padrão `test:e2e` ou no gate comum de CI.
- Devem ser acionados explicitamente por `test:bench`.
- Usam configuração própria: `workers: 1`, `fullyParallel: false`, `testDir: '.'` e output separado.
- Medem a build de produção, não o servidor dev. A única exceção precisa ser documentada.

## Estrutura recomendada

```text
nextweb/e2e/performance/
├─ README.md
├─ AGENTS.md
├─ playwright.config.ts
├─ playwright.uncapped.config.ts      # opcional: investigação sem limites usuais
├─ benchmark.ts                       # wrapper + report() padronizado
├─ chrome-trace.ts                    # opcional: coleta de trace
├─ dashboard/
│  ├─ renderizacao.spec.ts
│  ├─ renderizacao.fixture.ts
│  ├─ renderizacao.probe.ts
│  ├─ renderizacao.metrics.ts
│  └─ renderizacao.helpers.ts
└─ unit/
   └─ metricas.test.ts
```

Responsabilidades:

- `*.spec.ts`: descreve a interação e chama `report()`.
- `*.fixture.ts`: prepara dados/cenário de forma determinística.
- `*.probe.ts`: coleta sinais do navegador/DOM sem decisão de negócio.
- `*.metrics.ts`: transforma sinais em métricas e estatísticas.
- `*.helpers.ts`: utilitários pequenos e específicos.
- `unit/`: testa cálculo de métricas isoladamente.

## Como medir corretamente

1. Defina uma jornada com começo e fim objetivos: abrir dashboard até cards interativos, filtrar lista até resultado estável, trocar aba até conteúdo pronto.
2. Controle dados, conta, ambiente e viewport. Uma métrica sem cenário repetível não é comparável.
3. Faça warm-up quando necessário e registre se a métrica é cold ou warm.
4. Colete várias amostras. Não conclua regressão por uma execução isolada.
5. Reporte ao menos `durationMs`, nome da interação, contexto do cenário e versão/commit quando disponível.
6. Use mediana como medida principal e percentis para cauda quando houver amostras suficientes.
7. Antes de criar um threshold que quebra build, estabeleça baseline em ambiente estável. No início, trate benchmark como sinal e revisão manual.

## Wrapper de benchmark

Todo benchmark precisa emitir uma linha JSON previsível com prefixo `BENCHMARK`. O arquivo real deve ser implementado conforme a versão instalada de Playwright; mantenha uma API simples:

```ts
import { test as base, expect } from '@playwright/test'

type BenchmarkReport = {
  name: string
  durationMs: number
  metadata?: Record<string, string | number | boolean>
}

type BenchmarkFixtures = {
  report: (data: Omit<BenchmarkReport, 'name'>) => void
}

export const benchmark = base.extend<BenchmarkFixtures>({
  report: async ({}, use, testInfo) => {
    await use((data) => {
      console.log(`BENCHMARK ${JSON.stringify({ name: testInfo.title, ...data })}`)
    })
  },
})

export { expect }
```

Exemplo de spec:

```ts
import { benchmark, expect } from '../benchmark'

benchmark('dashboard: abre filtros e lista resultados', async ({ page, report }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  const inicio = performance.now()
  await page.getByRole('button', { name: 'Filtros' }).click()
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible()
  const durationMs = performance.now() - inicio

  report({
    durationMs,
    metadata: { scenario: 'authenticated-dashboard', mode: 'warm' },
  })
})
```

O exemplo é estrutural: adapte nomes de rota, elementos, conta e métrica ao produto real. Não invente métricas que o fluxo não consegue medir de maneira repetível.

## Configuração mínima

```ts
import { defineConfig, devices } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: '.',
  testIgnore: ['unit/**'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: '../test-results/performance',
  reporter: [['list'], ['json', { outputFile: '../test-results/performance/results.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
```

Ajuste o comando de produção ao framework real. Em Next.js pode ser `next build && next start`; em Vite frequentemente é build + preview. Não assuma antes de ler os scripts.

## O que não fazer

- Não execute benchmarks em paralelo.
- Não compare resultados de máquinas, navegadores, resoluções, dados ou builds diferentes como se fossem equivalentes.
- Não use o modo dev para concluir performance de produção.
- Não substitua testes funcionais por benchmark.
- Não aplique `waitForTimeout` para simular estabilidade. Espere por um estado final observável e deixe claro o que marcou fim da medição.
- Não esconda outliers; registre ambiente e investigue ruído.
- Não transforme uma execução manual lenta em bloqueio de CI sem baseline estável e acordo explícito.

## Entrega esperada

Ao concluir, informe: interação medida; definição exata de início/fim; ambiente e build; número de amostras; mediana/variação; artefatos gerados; comparação com baseline, quando houver; e limitações de confiabilidade.
