import { test, expect } from "@playwright/test";
import { assertUserPersistedIfDbConfigured, runCadastroFlow, runCadastroPasswordMismatchFlow } from "./cadastro.robot";

test.describe("cadastro real", () => {
  test("cadastro cria conta via backend real e entra no app", async ({ page }) => {
    const user = await runCadastroFlow(page);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("tcc_auth_token"))).not.toBeNull();
    await assertUserPersistedIfDbConfigured(user.email);
  });

  test("cadastro valida senha divergente", async ({ page }) => {
    await runCadastroPasswordMismatchFlow(page);
  });
});
