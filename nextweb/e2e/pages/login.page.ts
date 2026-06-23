import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async abrir() {
    await this.page.goto('/login')
  }

  async preencherCredenciais(email: string, senha: string) {
    await this.page.getByLabel('E-mail').fill(email)
    await this.page.getByLabel('Senha').fill(senha)
  }

  async clicarEntrar() {
    await this.page.getByRole('button', { name: 'Entrar' }).click()
  }

  async fazerLogin(email: string, senha: string) {
    await this.abrir()
    await this.preencherCredenciais(email, senha)
    await this.clicarEntrar()
  }

  async verificarLoginSucesso() {
    await expect(this.page).toHaveURL(/\/(inicio|dashboard)$/)
    await expect(this.page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
  }

  async verificarMensagemErro(mensagem: string) {
    await expect(this.page.getByText(mensagem)).toBeVisible()
  }
}