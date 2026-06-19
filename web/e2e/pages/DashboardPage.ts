import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  }

  async getAuthToken(): Promise<string> {
    const token = await this.page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    return token as string;
  }

  async expectAuthenticatedToken(): Promise<void> {
    await this.getAuthToken();
  }
}
