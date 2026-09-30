import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'

test('abre o painel administrativo na tela de login', async () => {
  test.setTimeout(90_000)

  const app = await electron.launch({
    args: [process.cwd()],
    env: { ...process.env, VITE_DEV_SERVER_URL: '' },
    timeout: 60_000,
  })

  try {
    const window = await app.firstWindow()

    await expect(window).toHaveTitle('CollabResearch Admin Desktop')
    await expect(window.getByRole('heading', { name: 'Admin Desktop' })).toBeVisible()
    await expect(window.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(window.getByRole('textbox', { name: 'Senha' })).toBeVisible()
  } finally {
    await app.close()
  }
})
