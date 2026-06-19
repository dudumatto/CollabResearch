import { test, expect } from "@playwright/test";
import { assertNotificationsApi, clearNotificationView, openNotifications, prepareNotificationUser } from "./notificacoes.robot";

test.describe("notificacoes real", () => {
  test("carrega notificacoes reais e limpa lista local", async ({ page, request }) => {
    const user = await prepareNotificationUser(request);
    await openNotifications(page, user);
    await clearNotificationView(page);

    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    await assertNotificationsApi(request, token!);
  });
});
