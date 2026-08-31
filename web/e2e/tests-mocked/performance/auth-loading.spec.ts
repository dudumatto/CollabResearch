import { expect, test } from "@playwright/test";
import { authenticateAs, mockUsers, setupApiMock } from "../../helpers/api-mock.helper";

test("rota protegida renderiza sem aguardar fallbacks pesados de usuario", async ({ page }) => {
  const requestedPaths: string[] = [];

  await setupApiMock(page, {
    user: mockUsers.advisor,
    delay: [{ rule: "/api/usuarios/me", ms: 4000 }],
  });
  await authenticateAs(page, mockUsers.advisor);

  page.on("request", (request) => {
    const url = new URL(request.url());
    requestedPaths.push(url.pathname);
  });

  const startedAt = Date.now();
  await page.goto("/app/projects");
  await expect(page.locator(".advisor-pagina")).toBeVisible();
  const elapsed = Date.now() - startedAt;

  expect(elapsed).toBeLessThan(3500);
  expect(requestedPaths).not.toContain("/api/usuarios");
});

