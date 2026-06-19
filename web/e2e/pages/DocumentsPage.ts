import { expect, type Page } from "@playwright/test";

export class DocumentsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/app/documents");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Documentos", exact: true })).toBeVisible();
  }
}
