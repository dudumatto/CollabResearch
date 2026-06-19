import { expect, type Page } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

type ApiErrorScenario = {
  path: string;
  fail: RegExp;
  expected: string;
  user?: (typeof mockUsers)[keyof typeof mockUsers];
};

export async function runApiErrorScenario(page: Page, scenario: ApiErrorScenario) {
  const user = scenario.user ?? mockUsers.student;
  await setupApiMock(page, { user, fail: [scenario.fail] });
  await authenticateAs(page, user);
  await page.goto(scenario.path);
  await expect(page.getByText(scenario.expected)).toBeVisible();
}
