import { test, expect } from "@playwright/test";
import {
  prepareConversationScenario,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  sendAndReturnMessageId,
} from "./conversations.robot";
import { assertForbidden, assertOk, assertCreated } from "../helpers/security.helper";
import { unique } from "../../helpers/test-data.helper";

test.describe("regressão BOLA/IDOR conversas", () => {
  let scenario: Awaited<ReturnType<typeof prepareConversationScenario>>;

  test.beforeAll(async ({ request }) => {
    scenario = await prepareConversationScenario(request);
  });

  test("participante (dono) lista mensagens com sucesso", async ({ request }) => {
    const response = await listMessages(request, scenario.a.token, scenario.conversationId);
    await assertOk(response);
    const messages = await response.json();
    expect(Array.isArray(messages)).toBeTruthy();
    expect(messages.length).toBeGreaterThan(0);
  });

  test("participante (B) lista mensagens com sucesso", async ({ request }) => {
    const response = await listMessages(request, scenario.b.token, scenario.conversationId);
    await assertOk(response);
  });

  test("não participante (C) não pode listar mensagens", async ({ request }) => {
    const response = await listMessages(request, scenario.c.token, scenario.conversationId);
    await assertForbidden(response);
  });

  test("participante (dono) envia mensagem com sucesso", async ({ request }) => {
    const conteudo = `msg-${unique("conv-owner-send")}`;
    const response = await sendMessage(request, scenario.a.token, scenario.conversationId, conteudo);
    await assertCreated(response);
    const msg = await response.json();
    expect(msg.conteudo).toBe(conteudo);
  });

  test("participante (B) envia mensagem com sucesso", async ({ request }) => {
    const conteudo = `msg-${unique("conv-b-send")}`;
    const response = await sendMessage(request, scenario.b.token, scenario.conversationId, conteudo);
    await assertCreated(response);
  });

  test("não participante (C) não pode enviar mensagem", async ({ request }) => {
    const response = await sendMessage(request, scenario.c.token, scenario.conversationId, "Tentativa de envio");
    await assertForbidden(response);
  });

  test("participante remetente (A) edita sua mensagem", async ({ request }) => {
    const msgId = await sendAndReturnMessageId(request, scenario.a.token, scenario.conversationId, `edit-${unique("a")}`);
    const response = await editMessage(request, scenario.a.token, msgId, "Mensagem editada pelo dono");
    await assertOk(response);
    const msg = await response.json();
    expect(msg.conteudo).toBe("Mensagem editada pelo dono");
    expect(msg.editada).toBe(true);
  });

  test("participante não-remetente (B) não edita mensagem de A", async ({ request }) => {
    const msgId = await sendAndReturnMessageId(request, scenario.a.token, scenario.conversationId, `no-edit-${unique("a")}`);
    const response = await editMessage(request, scenario.b.token, msgId, "Tentativa de edição");
    await assertForbidden(response);
  });

  test("não participante (C) não edita mensagem", async ({ request }) => {
    const response = await editMessage(request, scenario.c.token, scenario.messageId, "Tentativa externa");
    await assertForbidden(response);
  });

  test("participante remetente (A) exclui sua mensagem", async ({ request }) => {
    const msgId = await sendAndReturnMessageId(request, scenario.a.token, scenario.conversationId, `del-${unique("a")}`);
    const response = await deleteMessage(request, scenario.a.token, msgId);
    expect([200, 204]).toContain(response.status());
  });

  test("participante não-remetente (B) não exclui mensagem de A", async ({ request }) => {
    const msgId = await sendAndReturnMessageId(request, scenario.a.token, scenario.conversationId, `no-del-${unique("a")}`);
    const response = await deleteMessage(request, scenario.b.token, msgId);
    await assertForbidden(response);
  });

  test("não participante (C) não exclui mensagem", async ({ request }) => {
    const response = await deleteMessage(request, scenario.c.token, scenario.messageId);
    await assertForbidden(response);
  });
});
