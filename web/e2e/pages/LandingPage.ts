import { expect, type Page } from "@playwright/test";

export class LandingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async expectVisible(): Promise<void> {
    await expect(this.page).toHaveTitle("CollabResearch — Plataforma de Iniciação Científica");
    await expect(this.page.getByText("Sua pesquisa comeca aqui.")).toBeVisible();
  }

  async expectProtectedRouteRedirects(): Promise<void> {
    await this.page.goto("/app");
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
