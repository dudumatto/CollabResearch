import { expect, test } from "@playwright/test";
import {
  approveFirstMarcoViaReview,
  assertProgressApi,
  loginAndOpenProgress,
  prepareProgressScenario,
  publishUpdate,
  reloadProgressAndAssert,
} from "./progresso.robot";
import { unique } from "../../helpers/test-data.helper";
import { cleanupTestData } from "../../helpers/database-cleanup.helper";
import { verifyTestProfile, setupAdmin } from "../../helpers/journey.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("progresso estruturado", () => {
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

  test("orientador aprova o marco enviado pelo aluno e o progresso reflete os itens", async ({ page, request }) => {
    const ctx = await prepareProgressScenario(request);

    const marcoTitulo = await approveFirstMarcoViaReview(request, ctx);

    const login = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: ctx.orientador.email, senha: ctx.orientador.senha },
    });
    const auth = await login.json();
    const progress = await request.get(`${API_URL}/api/projects/${ctx.projectId}/progress`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    expect(progress.ok()).toBeTruthy();
    const payload = await progress.json();
    expect(payload.itensTotal).toBe(1);
    expect(payload.itensConcluidos).toBe(1);
    expect(payload.percentualGeral).toBe(100);
    expect(payload.marcosConcluidos).toBe(1);

    await loginAndOpenProgress(page, ctx.orientador);
    await reloadProgressAndAssert(page, marcoTitulo);
  });

  test("aluno publica atualização com categoria sem alterar o checklist", async ({ page, request }) => {
    const ctx = await prepareProgressScenario(request);

    await loginAndOpenProgress(page, ctx.aluno);
    const title = `Atualização ${unique("progress")}`;
    await publishUpdate(page, {
      title,
      category: "meeting",
      description: "Reunião de alinhamento do andamento do projeto.",
      withoutDate: true,
    });

    const login = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: ctx.aluno.email, senha: ctx.aluno.senha },
    });
    const auth = await login.json();
    const update = await assertProgressApi(request, auth.token, ctx.projectId, title);
    expect(update.createdAt).toBeNull();
    await expect(page.getByText(/feed de atualizações/i)).toHaveCount(0);
  });
});
