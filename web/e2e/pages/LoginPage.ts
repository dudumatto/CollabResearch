import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByPlaceholder("seu@universidade.br")).toBeVisible();
    await expect(this.page.getByPlaceholder("Digite sua senha")).toBeVisible();
  }

  async fillForm(email: string, password: string): Promise<void> {
    await this.page.getByPlaceholder("seu@universidade.br").fill(email);
    await this.page.getByPlaceholder("Digite sua senha").fill(password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Entrar" }).click();
    await expect(this.page).toHaveURL(/\/app$/);
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.expectVisible();
    await this.fillForm(email, password);
    await this.submit();
  }
}
