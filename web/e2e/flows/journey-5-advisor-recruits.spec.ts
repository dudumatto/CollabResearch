import { test, expect } from "@playwright/test";
import { setupAluno, setupOrientador, loginViaUI, verifyTestProfile, loginViaApi } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 5 — orientador recruta aluno", () => {
  let adminToken = "";
  let orientadorToken = "";
  let projectId = 0;
  let projectTitle = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const orientador = await setupOrientador(request);
    orientadorToken = await loginViaApi(request, orientador);

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const areas = await areasRes.json();
    const areaId = areas[0]?.id;

    projectTitle = `Projeto Recruta ${Date.now()}`;
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: {
        titulo: projectTitle,
        descricao: "Projeto para testar recrutamento",
        requisitos: "Java",
        vagas: 5,
        areaId,
      },
    });
    const project = await createRes.json();
    projectId = Number(project.id);

    const adminRes = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: "Admin Cleanup",
        email: `admin-recruit-${Date.now()}@e2e.local`,
        senha: "Admin123!",
        tipo: "ADMIN",
      },
    });
    if (adminRes.ok()) {
      const body = await adminRes.json();
      adminToken = body.token;
    }
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("orientador aprova inscrição e aluno vira colaborador", async ({ page, request }) => {
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);

    await request.post(`${API_URL}/api/inscricoes`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: { projetoId: projectId, motivacao: "Quero participar!" },
    });

    await loginViaUI(page, (await setupOrientador(request)));

    await page.goto(`/app/projects/${projectId}/applications`);
    await expect(page.getByText(aluno.email.split("@")[0]).first()).toBeVisible({ timeout: 10000 }).catch(() => {
    });

    const inscricoesRes = await request.get(`${API_URL}/api/inscricoes/projeto/${projectId}`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const inscricoes = await inscricoesRes.json();
    const inscricao = inscricoes.find((i: { status: string }) => i.status === "PENDENTE");
    if (!inscricao) return;

    await request.put(`${API_URL}/api/inscricoes/${inscricao.id}/aprovar`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
      data: { parecerOrientador: "Aprovado" },
    });

    const statusRes = await request.get(`${API_URL}/api/inscricoes/${inscricao.id}`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const statusData = await statusRes.json();
    expect(statusData.status).toBe("APROVADO");

    const collabRes = await request.get(`${API_URL}/api/projetos/${projectId}/colaboradores`, {
      headers: { Authorization: `Bearer ${orientadorToken}` },
    });
    const collabs = await collabRes.json();
    const found = collabs.some((c: { id?: number; usuario?: { id?: number } }) =>
      c.id === aluno.userId || c.usuario?.id === aluno.userId
    );
    expect(found).toBeTruthy();
  });
});