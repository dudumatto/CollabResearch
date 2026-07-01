import { test, expect } from "@playwright/test";
import { setupAluno, setupOrientador, loginViaUI, verifyTestProfile, loginViaApi, setupAdmin } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 6 — equipe colabora", () => {
  let adminToken = "";
  let orientador: Awaited<ReturnType<typeof setupOrientador>>;
  let aluno: Awaited<ReturnType<typeof setupAluno>>;
  let projectId = 0;
  let conversationId = 0;

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    orientador = await setupOrientador(request);
    aluno = await setupAluno(request);
    const orientadorToken = await loginViaApi(request, orientador);
    const alunoToken = await loginViaApi(request, aluno);

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const areas = await areasRes.json();
    const areaId = areas[0]?.id;

    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: {
        titulo: `Projeto Chat ${Date.now()}`,
        descricao: "Projeto para testar colaboracao",
        requisitos: "Java",
        vagas: 5,
        areaId,
      },
    });
    const project = await createRes.json();
    projectId = Number(project.id);

    await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: { projetoId: projectId, motivacao: "Quero participar!" },
    });

    const inscricoesRes = await request.get(`${API_URL}/api/inscricoes/projeto/${projectId}`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const inscricoes = await inscricoesRes.json();
    const inscricao = inscricoes.find((i: { status: string }) => i.status === "PENDENTE");
    if (inscricao) {
      await request.put(`${API_URL}/api/inscricoes/${inscricao.id}/aprovar`, {
        headers: { Authorization: `Bearer ${orientadorToken}` },
        data: { parecerOrientador: "Aprovado" },
      });
    }

    const convRes = await request.post(`${API_URL}/api/conversas`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: { projetoId: projectId },
    });
    if (convRes.ok()) {
      const conv = await convRes.json();
      conversationId = Number(conv.id);
    }

    const admin = await setupAdmin(request);
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: admin.email, senha: admin.senha },
    });
    if (loginRes.ok()) {
      const body = await loginRes.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("orientador envia mensagem e aluno recebe em tempo real", async ({ browser, request }) => {
    if (!conversationId) return;

    const orientadorContext = await browser.newContext();
    const alunoContext = await browser.newContext();
    const orientadorPage = await orientadorContext.newPage();
    const alunoPage = await alunoContext.newPage();

    try {
      await loginViaUI(orientadorPage, orientador);
      await orientadorPage.goto(`/app/chat?conversationId=${conversationId}`);
      await expect(orientadorPage.locator(".pagina-chat__input-mensagem")).toBeVisible({ timeout: 10000 });
      await orientadorPage.waitForTimeout(1000);

      await loginViaUI(alunoPage, aluno);
      await alunoPage.goto(`/app/chat?conversationId=${conversationId}`);
      await expect(alunoPage.locator(".pagina-chat__input-mensagem")).toBeVisible({ timeout: 10000 });
      await alunoPage.waitForTimeout(1000);

      const message = `Ola equipe! ${Date.now()}`;
      await orientadorPage.getByPlaceholder("Digite uma mensagem").fill(message);
      await orientadorPage.locator(".pagina-chat__botao-enviar").click();
      await expect(orientadorPage.getByText(message)).toBeVisible();

      await expect(alunoPage.getByText(message)).toBeVisible({ timeout: 15000 });
    } finally {
      await orientadorContext.close();
      await alunoContext.close();
    }
  });

  test("participante edita mensagem e outro ve mudanca", async ({ browser }) => {
    if (!conversationId) return;

    const senderContext = await browser.newContext();
    const receiverContext = await browser.newContext();
    const senderPage = await senderContext.newPage();
    const receiverPage = await receiverContext.newPage();

    try {
      await loginViaUI(senderPage, orientador);
      await senderPage.goto(`/app/chat?conversationId=${conversationId}`);
      await expect(senderPage.locator(".pagina-chat__input-mensagem")).toBeVisible({ timeout: 10000 });
      await senderPage.waitForTimeout(1000);

      await loginViaUI(receiverPage, aluno);
      await receiverPage.goto(`/app/chat?conversationId=${conversationId}`);
      await expect(receiverPage.locator(".pagina-chat__input-mensagem")).toBeVisible({ timeout: 10000 });
      await receiverPage.waitForTimeout(1000);

      const originalMsg = `Original ${Date.now()}`;
      await senderPage.getByPlaceholder("Digite uma mensagem").fill(originalMsg);
      await senderPage.locator(".pagina-chat__botao-enviar").click();
      await expect(senderPage.getByText(originalMsg)).toBeVisible();
      await expect(receiverPage.getByText(originalMsg)).toBeVisible({ timeout: 15000 });

      const editedMsg = `Editado ${Date.now()}`;
      const msgBubble = senderPage.locator(".mensagem-texto", { hasText: originalMsg });
      await msgBubble.hover();
      await senderPage.locator(".mensagem-acao-btn[title='Editar mensagem']").click();
      await senderPage.locator(".modal__textarea").fill(editedMsg);
      await senderPage.locator(".modal__btn--confirmar").click();
      await expect(senderPage.getByText(editedMsg)).toBeVisible();

      await expect(receiverPage.getByText(editedMsg)).toBeVisible({ timeout: 15000 });
    } finally {
      await senderContext.close();
      await receiverContext.close();
    }
  });
});