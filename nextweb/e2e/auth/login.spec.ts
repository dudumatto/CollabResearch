import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('usuário não autenticado é redirecionado para login ao acessar rota protegida', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(process.env.E2E_ALUNO_EMAIL!)
    await page.getByLabel('Senha').fill(process.env.E2E_ALUNO_PASSWORD!)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/(inicio|dashboard)$/)
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
  })

  test('login com credenciais inválidas exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('invalido@email.com')
    await page.getByLabel('Senha').fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Credenciais inválidas')).toBeVisible()
  })
})