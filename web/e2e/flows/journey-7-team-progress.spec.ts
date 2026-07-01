import { test, expect } from "@playwright/test";
import { setupAluno, setupOrientador, loginViaUI, verifyTestProfile, loginViaApi } from "../helpers/journey.helper";
import { cleanupTestData } from "../helpers/database-cleanup.helper";

const API_URL = process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

test.describe("jornada 7 — equipe acompanha progresso", () => {
  let adminToken = "";
  let orientador: Awaited<ReturnType<typeof setupOrientador>>;
  let aluno: Awaited<ReturnType<typeof setupAluno>>;
  let projectId = 0;

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
        titulo: `Projeto Progresso ${Date.now()}`,
        descricao: "Projeto para testar progresso",
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

    const adminRes = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: "Admin Cleanup",
        email: `admin-prog-${Date.now()}@e2e.local`,
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

  test("participante registra progresso e aparece na timeline", async ({ page, request }) => {
    const alunoToken = await loginViaApi(request, aluno);
    await loginViaUI(page, aluno);
    await page.goto(`/app/progress`);

    const createRes = await request.post(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: {
        titulo: "Reuniao de alinhamento",
        descricao: "Primeira reuniao da equipe para alinhar objetivos.",
        tipo: "ATUALIZACAO",
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const progresso = await createRes.json();
    expect(progresso.id).toBeGreaterThan(0);

    const listRes = await request.get(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    const progressos = await listRes.json();
    expect(progressos.length).toBeGreaterThan(0);
    expect(progressos.some((p: { titulo: string }) => p.titulo === "Reuniao de alinhamento")).toBeTruthy();
  });

  test("autor edita progresso e alteracao persiste", async ({ request }) => {
    const alunoToken = await loginViaApi(request, aluno);

    const createRes = await request.post(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: {
        titulo: "Progresso para editar",
        descricao: "Descricao original.",
        tipo: "ATUALIZACAO",
      },
    });
    const progresso = await createRes.json();

    const updateRes = await request.put(`${API_URL}/api/progresso/${progresso.id}`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: {
        titulo: "Progresso editado",
        descricao: "Descricao atualizada.",
        tipo: "ATUALIZACAO",
      },
    });
    expect(updateRes.ok(), await updateRes.text()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.titulo).toBe("Progresso editado");

    const getRes = await request.get(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    const list = await getRes.json();
    expect(list.some((p: { titulo: string }) => p.titulo === "Progresso editado")).toBeTruthy();
  });

  test("participante remove progresso e some da lista", async ({ request }) => {
    const alunoToken = await loginViaApi(request, aluno);

    const createRes = await request.post(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
      data: {
        titulo: "Progresso para remover",
        descricao: "Sera removido.",
        tipo: "ATUALIZACAO",
      },
    });
    const progresso = await createRes.json();

    const deleteRes = await request.delete(`${API_URL}/api/progresso/${progresso.id}`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    expect([200, 204]).toContain(deleteRes.status());

    const listRes = await request.get(`${API_URL}/api/projetos/${projectId}/progresso`, {
      headers: { Authorization: `Bearer ${alunoToken}` },
    });
    const list = await listRes.json();
    expect(list.some((p: { id: number }) => p.id === progresso.id)).toBeFalsy();
  });
});