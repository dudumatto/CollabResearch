import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { buildLoginCandidate } from "../../factories/auth.factory";
import { LoginPage } from "../../pages/LoginPage";
import { unique } from "../../helpers/test-data.helper";

const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function prepareChatUsers(request: APIRequestContext) {
  const a = buildLoginCandidate();
  const b = buildLoginCandidate();
  await request.post(`${API_URL}/api/auth/register`, { data: { nome: a.nome, email: a.email, senha: a.senha, ra: a.ra } });
  await request.post(`${API_URL}/api/auth/register`, { data: { nome: b.nome, email: b.email, senha: b.senha, ra: b.ra } });

  const loginA = await request.post(`${API_URL}/api/auth/login`, { data: { email: a.email, senha: a.senha } });
  const loginB = await request.post(`${API_URL}/api/auth/login`, { data: { email: b.email, senha: b.senha } });
  expect(loginA.ok()).toBeTruthy();
  expect(loginB.ok()).toBeTruthy();

  const authA = await loginA.json();
  const authB = await loginB.json();
  const userAId = Number(authA.user?.id ?? authA.usuario?.id ?? authA.id);
  const userBId = Number(authB.user?.id ?? authB.usuario?.id ?? authB.id);
  expect(userAId).toBeTruthy();
  expect(userBId).toBeTruthy();

  const conversation = await request.post(`${API_URL}/api/conversas/privada/${userBId}`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  expect(conversation.ok()).toBeTruthy();

  return {
    a: { ...a, id: userAId, token: authA.token },
    b: { ...b, id: userBId, token: authB.token },
    conversation: await conversation.json(),
  };
}

export async function loginAndOpenChat(page: Page, user: { email: string; senha: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(user.email, user.senha);
  await page.goto("/app/chat");
  await expect(page.locator(".pagina-chat__titulo-lista", { hasText: "Mensagens" })).toBeVisible();
}

export async function sendChatMessage(page: Page) {
  const message = `msg-${unique("chat")}`;
  const input = page.getByPlaceholder("Digite uma mensagem");
  if (!(await input.isVisible())) return null;
  await input.fill(message);
  await page.locator(".pagina-chat__botao-enviar").click();
  await expect(page.getByText(message)).toBeVisible();
  return message;
}

export async function assertChatApiReachable(request: APIRequestContext, token: string, userId: number) {
  const res = await request.get(`${API_URL}/api/conversas/${userId}/todas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
}

export async function assertRealtimeMessageDelivery(browser: Browser, request: APIRequestContext) {
  const { a, b, conversation } = await prepareChatUsers(request);
  const conversationId = Number(conversation.id);
  expect(conversationId).toBeTruthy();

  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const senderPage = await senderContext.newPage();
  const receiverPage = await receiverContext.newPage();

  try {
    await loginAndOpenChat(senderPage, a);
    await loginAndOpenChat(receiverPage, b);

    await openConversation(senderPage, conversationId);
    await openConversation(receiverPage, conversationId);
    await expect(receiverPage.locator(".pagina-chat__input-mensagem")).toBeVisible();

    const message = `realtime-${unique("chat")}`;
    await senderPage.getByPlaceholder("Digite uma mensagem").fill(message);
    await senderPage.locator(".pagina-chat__botao-enviar").click();

    await expect(senderPage.getByText(message)).toBeVisible();
    await expect(receiverPage.getByText(message)).toBeVisible({ timeout: 15_000 });
  } finally {
    await senderContext.close();
    await receiverContext.close();
  }
}

async function openConversation(page: Page, conversationId: number) {
  await page.goto(`/app/chat?conversationId=${conversationId}`);
  await expect(page.locator(".pagina-chat__input-mensagem")).toBeVisible();
  await page.waitForTimeout(1000);
}
