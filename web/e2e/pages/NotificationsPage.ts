import { expect, type Page } from "@playwright/test";

export class NotificationsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/notifications");
    await this.expectVisible();
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator(".skeleton").first()).toBeHidden();
    await expect(this.page.getByRole("heading", { name: /Notifica(?:\u00e7|c)(?:\u00f5|o)es/i })).toBeVisible();
    await expect(this.page.locator(".pagina-notificacoes")).toBeVisible();
  }
}
