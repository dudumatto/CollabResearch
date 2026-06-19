import { expect, type Page } from "@playwright/test";

export class SettingsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/configuracoes");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  }
}
