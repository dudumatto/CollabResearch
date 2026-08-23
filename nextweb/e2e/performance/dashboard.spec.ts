import { benchmark, expect } from './benchmark'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8080'
const PASSWORD = 'SenhaE2E123!'

benchmark('dashboard: carrega resumo autenticado', async ({ page, request, report }) => {
  const suffix = Date.now()
  const email = `bench-aluno-${suffix}@e2e.local`

  await request.post(`${API_URL}/api/auth/register`, {
    data: {
      nome: 'Aluno Bench E2E',
      email,
      senha: PASSWORD,
      ra: `ra${suffix}`,
    },
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/app$/)

  const inicio = performance.now()
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  const durationMs = performance.now() - inicio

  report({
    durationMs,
    metadata: { scenario: 'authenticated-dashboard', mode: 'warm' },
  })
})
