import { test, expect } from "@playwright/test";
import { assertDocumentListedByApi, loginAndOpenDocuments, prepareDocumentUser, uploadDocument } from "./documentos.robot";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("documentos real", () => {
  test("envia documento e valida lista real", async ({ page, request }) => {
    const user = await prepareDocumentUser(request);
    await loginAndOpenDocuments(page, user);
    await uploadDocument(page);

    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    const meRes = await request.get(`${API_URL}/api/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(meRes.ok()).toBeTruthy();
    const me = await meRes.json();
    await assertDocumentListedByApi(request, token!, Number(me.id));
  });
});
