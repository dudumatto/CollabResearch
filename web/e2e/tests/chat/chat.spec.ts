import { test, expect } from "@playwright/test";
import { assertChatApiReachable, assertRealtimeMessageDelivery, loginAndOpenChat, prepareChatUsers, sendChatMessage } from "./chat.robot";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("chat real", () => {
  test("abre chat, envia mensagem quando houver conversa e valida endpoint real", async ({ page, request }) => {
    const { a } = await prepareChatUsers(request);
    await loginAndOpenChat(page, a);
    await sendChatMessage(page);

    const token = await page.evaluate(() => localStorage.getItem("tcc_auth_token"));
    expect(token).toBeTruthy();
    const meRes = await request.get(`${API_URL}/api/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(meRes.ok()).toBeTruthy();
    const me = await meRes.json();
    await assertChatApiReachable(request, token!, Number(me.id));
  });

  test("entrega mensagem em tempo real sem recarregar a conversa", async ({ browser, request }) => {
    await assertRealtimeMessageDelivery(browser, request);
  });
});
