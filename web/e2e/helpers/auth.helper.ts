import type { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import type { TestUser } from "./test-data.helper";

export async function clearBrowserSession(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function loginAs(page: Page, user: TestUser): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.password);
}
