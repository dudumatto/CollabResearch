import { expect, type Page } from "@playwright/test";

export class LandingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.locator(".hero__title").waitFor();
  }

  async expectVisible(): Promise<void> {
    await expect(this.page).toHaveTitle("CollabResearch | Menos burocracia, mais pesquisa");
    await expect(this.page.locator(".hero__title")).toBeVisible();
  }

  async expectProtectedRouteRedirects(): Promise<void> {
    await this.page.goto("/app");
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
