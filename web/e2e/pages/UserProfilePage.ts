import { expect, type Page } from "@playwright/test";

export class UserProfilePage {
  constructor(private readonly page: Page) {}

  async goto(userId: number | string): Promise<void> {
    await this.page.goto(`/app/users/${userId}`);
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator(".cartao-perfil__nome")).toBeVisible();
  }

  async expectUserName(name: string): Promise<void> {
    await expect(this.page.locator(".cartao-perfil__nome").first()).toContainText(name);
  }

  async expectUserType(): Promise<void> {
    await expect(this.page.locator(".cartao-perfil__tipo")).toBeVisible();
  }

  async expectNotFound(): Promise<void> {
    await expect(this.page.getByText(/não encontrado|indisponível/i)).toBeVisible();
  }
}
