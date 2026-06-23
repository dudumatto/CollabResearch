import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/login.page'

type TestFixtures = {
  loginPage: LoginPage
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  },
})

export { expect }