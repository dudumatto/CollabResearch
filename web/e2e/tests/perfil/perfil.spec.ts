import { test, expect } from "@playwright/test";
import { assertProfileApi, loginAndOpenProfile, prepareProfileUser, reloadProfileAndAssert, updateProfileFields } from "./perfil.robot";

test.describe("perfil real", () => {
  test("atualiza dados de perfil e valida persistencia real", async ({ page, request }) => {
    const user = await prepareProfileUser(request);
    await loginAndOpenProfile(page, user);
    const payload = await updateProfileFields(page);
    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await assertProfileApi(request, token!, payload.nome);
    await reloadProfileAndAssert(page, payload.nome);
  });
});
