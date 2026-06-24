import { test, expect } from "@playwright/test";
import { prepareValidationUser, xssPayloads } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";

test.describe("XSS payloads", () => {
  let token: string;
  let projectId: number;
  let userId: number;
  let areaId: number;

  test.beforeAll(async ({ request }) => {
    const user = await prepareValidationUser(request);
    token = user.token;
    userId = user.id;

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const areas = await areasRes.json();
    areaId = areas[0]?.id;

    const draft = buildProjectCandidate();
    const createRes = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { titulo: draft.title, descricao: draft.description, vagas: draft.slots, areaId },
    });
    const project = await createRes.json();
    projectId = Number(project.id);
  });

  for (const payload of xssPayloads()) {
    test(`POST /api/projetos com XSS no titulo não retorna 500: ${payload.slice(0, 30)}...`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/projetos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { titulo: payload, descricao: "Teste", vagas: 1, areaId },
      });
      expect(response.status(), `XSS payload retornou 500`).not.toBe(500);
    });
  }

  for (const payload of xssPayloads()) {
    test(`POST /api/projetos com XSS na descrição não retorna 500: ${payload.slice(0, 30)}...`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/projetos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { titulo: "Projeto XSS", descricao: payload, vagas: 1, areaId },
      });
      expect(response.status(), `XSS payload retornou 500`).not.toBe(500);
    });
  }

  for (const payload of xssPayloads()) {
    test(`POST /api/feedback com XSS no comentário não retorna 500: ${payload.slice(0, 30)}...`, async ({ request }) => {
      const response = await request.post(`${API_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { projetoId: projectId, nota: 5, comentario: payload },
      });
      expect(response.status(), `XSS payload retornou 500`).not.toBe(500);
    });
  }

  for (const payload of xssPayloads()) {
    test(`PUT /api/usuarios/{id} com XSS no nome não retorna 500: ${payload.slice(0, 30)}...`, async ({ request }) => {
      const response = await request.put(`${API_URL}/api/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { nome: payload },
      });
      expect(response.status(), `XSS payload retornou 500`).not.toBe(500);
    });
  }
});
