import { expect, type Page } from "@playwright/test";

export class ApplicationsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/applications");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Minhas Inscrições", exact: true })).toBeVisible();
  }
}
