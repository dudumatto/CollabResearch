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