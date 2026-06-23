# Benchmarks de Performance

Esta pasta contém benchmarks manuais de performance usando Playwright.

## Regras Importantes

1. **Execução**: Benchmarks são manuais e executados com `npm run test:bench`
2. **Build**: Medem a build de produção, não o servidor dev
3. **Paralelismo**: Executam serialmente (`workers: 1`)
4. **Isolamento**: Estão fora do gate padrão de CI

## Estrutura

```
performance/
├── playwright.config.ts      # Configuração própria
├── benchmark.ts              # Wrapper padronizado
├── dashboard.spec.ts         # Exemplo de benchmark
└── unit/                     # Testes unitários de métricas
```

## Como Criar um Benchmark

1. Crie um arquivo `.spec.ts` nesta pasta
2. Importe `benchmark` e `expect` de `../benchmark`
3. Use o fixture `report` para emitir métricas
4. Defina início e fim da medição claramente

## Exemplo

```ts
import { benchmark, expect } from '../benchmark'

benchmark('nome do cenário', async ({ page, report }) => {
  // Ação que quer medir
  const inicio = performance.now()
  // ... interação ...
  const durationMs = performance.now() - inicio

  report({
    durationMs,
    metadata: { scenario: 'nome-do-cenario', mode: 'warm' },
  })
})
```

## Métricas

- `durationMs`: tempo da interação em milissegundos
- `metadata`: informações extras (cenário, modo, etc.)

## Análise

1. Execute múltiplas vezes para obter amostras
2. Use mediana como medida principal
3. Compare com baseline antes de concluir regressão
4. Registre ambiente e build