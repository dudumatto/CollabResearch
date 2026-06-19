import { expect, type Page } from "@playwright/test";

export async function expectToastSuccess(page: Page, message: string): Promise<void> {
  await expect(page.getByText(message)).toBeVisible();
}

export function expectArrayNotEmpty<T>(items: T[], label: string): void {
  expect(items.length, `${label} should not be empty`).toBeGreaterThan(0);
}

export function expectProjectId(value: number): void {
  expect(value, "created project id should be present").toBeGreaterThan(0);
}
