import { test, expect } from "@playwright/test";
import {
  setupAluno,
  setupOrientador,
  setupAdmin,
  loginViaApi,
  verifyTestProfile,
} from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

async function createProjectAndInscricao(
  request: any,
  orientadorToken: string,
  alunoToken: string
): Promise<{ projectId: number; inscricaoId: number }> {
  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${orientadorToken}` },
  });
  const areas = await areasRes.json();
  const areaId = areas[0]?.id;

  const projectRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${orientadorToken}` },
    data: {
      titulo: `Projeto Teste ${Date.now()}`,
      descricao: "Projeto para teste",
      requisitos: "Java",
      vagas: 5,
      areaId,
    },
  });
  const project = await projectRes.json();
  const projectId = Number(project.id);

  await request.post(`${API_URL}/api/inscricoes`, {
    headers: { Authorization: `Bearer ${alunoToken}` },
    data: { projetoId: projectId, motivacao: "Quero participar!" },
  });

  const inscricoesRes = await request.get(`${API_URL}/api/inscricoes/projeto/${projectId}`, {
    headers: { Authorization: `Bearer ${orientadorToken}` },
  });
  const inscricoes = await inscricoesRes.json();
  const inscricao = inscricoes.find((i: { status: string }) => i.status === "PENDENTE");
  const inscricaoId = inscricao ? Number(inscricao.id) : 0;

  return { projectId, inscricaoId };
}

test.describe("jornada 8 — admin modera plataforma", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    await verifyTestProfile(request);
    const admin = await setupAdmin(request);
    adminToken = await loginViaApi(request, admin);
  });

  test.afterEach(async ({ request }) => {
    if (adminToken) await cleanupTestData(request, adminToken);
  });

  test("admin lista usuarios", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.content || data.length).toBeTruthy();
  });

  test("admin busca usuario por id", async ({ request }) => {
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);
    const meRes = await request.get(`${API_URL}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    const meData = await meRes.json();
    const userId = Number(meData.id);

    const res = await request.get(`${API_URL}/api/admin/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const user = await res.json();
    expect(user.id).toBe(userId);
  });

  test("admin desativa e reativa usuario", async ({ request }) => {
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);
    const meRes = await request.get(`${API_URL}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    const meData = await meRes.json();
    const userId = Number(meData.id);

    const deactivateRes = await request.patch(`${API_URL}/api/admin/usuarios/${userId}/ativo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ativo: false },
    });
    expect(deactivateRes.ok(), await deactivateRes.text()).toBeTruthy();
    const deactivated = await deactivateRes.json();
    expect(deactivated.ativo).toBe(false);

    const activateRes = await request.patch(`${API_URL}/api/admin/usuarios/${userId}/ativo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ativo: true },
    });
    expect(activateRes.ok(), await activateRes.text()).toBeTruthy();
    const activated = await activateRes.json();
    expect(activated.ativo).toBe(true);
  });

  test("admin lista projetos", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/projetos`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.content || data.length).toBeTruthy();
  });

  test("admin altera status de projeto", async ({ request }) => {
    const orientador = await setupOrientador(request);
    const orientadorToken = await loginViaApi(request, orientador);
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);
    const { projectId } = await createProjectAndInscricao(request, orientadorToken, alunoToken);

    const res = await request.patch(`${API_URL}/api/admin/projetos/${projectId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: "EM_ANDAMENTO" },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const updated = await res.json();
    expect(updated.status).toBe("EM_ANDAMENTO");
  });

  test("admin lista inscricoes", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/inscricoes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.content || data.length).toBeTruthy();
  });

  test("admin altera status de inscricao", async ({ request }) => {
    const orientador = await setupOrientador(request);
    const orientadorToken = await loginViaApi(request, orientador);
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);
    const { inscricaoId } = await createProjectAndInscricao(request, orientadorToken, alunoToken);

    if (!inscricaoId) return;

    const res = await request.patch(`${API_URL}/api/admin/inscricoes/${inscricaoId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: "APROVADO" },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const updated = await res.json();
    expect(updated.status).toBe("APROVADO");
  });

  test("admin acessa dashboard", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.totalUsuarios).toBeGreaterThanOrEqual(0);
  });

  test("admin acessa relatorio resumo", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/relatorios/resumo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
  });

  test("admin acessa auditoria", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/admin/auditoria`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
  });

  test("aluno nao acessa endpoints admin", async ({ request }) => {
    const aluno = await setupAluno(request);
    const alunoToken = await loginViaApi(request, aluno);

    const endpoints = [
      `${API_URL}/api/admin/usuarios`,
      `${API_URL}/api/admin/projetos`,
      `${API_URL}/api/admin/inscricoes`,
      `${API_URL}/api/admin/dashboard`,
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint, {
        headers: { Authorization: `Bearer ${alunoToken}` },
      });
      expect(res.status(), `${endpoint} should be forbidden for aluno`).toBe(403);
    }
  });

  test("orientador nao acessa endpoints admin", async ({ request }) => {
    const orientador = await setupOrientador(request);
    const orientadorToken = await loginViaApi(request, orientador);

    const endpoints = [
      `${API_URL}/api/admin/usuarios`,
      `${API_URL}/api/admin/projetos`,
      `${API_URL}/api/admin/inscricoes`,
      `${API_URL}/api/admin/dashboard`,
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint, {
        headers: { Authorization: `Bearer ${orientadorToken}` },
      });
      expect(res.status(), `${endpoint} should be forbidden for orientador`).toBe(403);
    }
  });

  test("sem token nao acessa endpoints admin", async ({ request }) => {
    const endpoints = [
      `${API_URL}/api/admin/usuarios`,
      `${API_URL}/api/admin/projetos`,
      `${API_URL}/api/admin/inscricoes`,
      `${API_URL}/api/admin/dashboard`,
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint);
      expect(res.status(), `${endpoint} should require auth`).toBe(401);
    }
  });
});
