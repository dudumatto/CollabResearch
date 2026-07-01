import { test, expect } from "@playwright/test";
import { assertProfileApi, loginAndOpenProfile, prepareProfileUser, reloadProfileAndAssert, updateProfileFields } from "./perfil.robot";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("perfil real", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (res.ok()) {
      const body = await res.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

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