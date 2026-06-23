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