import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, type AuthenticatedUser } from "../helpers/security.helper";
import { API_URL } from "../../helpers/api.helper";

export type ConversationScenario = {
  a: AuthenticatedUser;
  b: AuthenticatedUser;
  c: AuthenticatedUser;
  conversationId: number;
  messageId: number;
};

export async function prepareConversationScenario(request: APIRequestContext): Promise<ConversationScenario> {
  const a = await registerAndLogin(request, "conv-owner");
  const b = await registerAndLogin(request, "conv-participant");
  const c = await registerAndLogin(request, "conv-outsider");

  const createConvRes = await request.post(`${API_URL}/api/conversas/privada/${b.id}`, {
    headers: { Authorization: `Bearer ${a.token}` },
  });
  expect(createConvRes.ok(), `Failed to create conversation: ${await createConvRes.text()}`).toBeTruthy();
  const conv = await createConvRes.json();
  const conversationId = Number(conv.id);
  expect(conversationId).toBeGreaterThan(0);

  const msgRes = await request.post(`${API_URL}/api/conversas/${conversationId}/mensagem`, {
    headers: { Authorization: `Bearer ${a.token}` },
    data: { conteudo: "Mensagem inicial de teste E2E" },
  });
  expect(msgRes.ok(), `Failed to send message: ${await msgRes.text()}`).toBeTruthy();
  const msg = await msgRes.json();
  const messageId = Number(msg.id);
  expect(messageId).toBeGreaterThan(0);

  return { a, b, c, conversationId, messageId };
}

export async function listMessages(request: APIRequestContext, token: string, conversationId: number) {
  return request.get(`${API_URL}/api/conversas/${conversationId}/mensagens`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function sendMessage(request: APIRequestContext, token: string, conversationId: number, conteudo: string) {
  return request.post(`${API_URL}/api/conversas/${conversationId}/mensagem`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { conteudo },
  });
}

export async function editMessage(request: APIRequestContext, token: string, messageId: number, novoConteudo: string) {
  return request.put(`${API_URL}/api/conversas/mensagem/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { conteudo: novoConteudo },
  });
}

export async function deleteMessage(request: APIRequestContext, token: string, messageId: number) {
  return request.delete(`${API_URL}/api/conversas/mensagem/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function sendAndReturnMessageId(request: APIRequestContext, token: string, conversationId: number, conteudo: string): Promise<number> {
  const res = await sendMessage(request, token, conversationId, conteudo);
  expect(res.ok(), `Failed to send message: ${await res.text()}`).toBeTruthy();
  const msg = await res.json();
  return Number(msg.id);
}
