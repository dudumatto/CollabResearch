import { test, expect } from "@playwright/test";
import { prepareValidationUser, sendMalformedJsonWithAuth } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";

test.describe("campos obrigatórios", () => {
  let token: string;
  let areaId: number;

  test.beforeAll(async ({ request }) => {
    const user = await prepareValidationUser(request);
    token = user.token;

    const areasRes = await request.get(`${API_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const areas = await areasRes.json();
    areaId = areas[0]?.id;
  });

  test("POST /api/projetos com body vazio retorna 400", async ({ request }) => {
    const response = await sendMalformedJsonWithAuth(request, token, "/api/projetos", "{}");
    expect(response.status()).toBe(400);
  });

  test("POST /api/projetos com titulo vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { titulo: "", vagas: 1, areaId },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/projetos sem titulo retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { vagas: 1, areaId },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/projetos sem vagas retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { titulo: "Teste", areaId },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/projetos sem areaId retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/projetos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { titulo: "Teste", vagas: 1 },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/feedback com body vazio retorna 400", async ({ request }) => {
    const response = await sendMalformedJsonWithAuth(request, token, "/api/feedback", "{}");
    expect(response.status()).toBe(400);
  });

  test("POST /api/inscricoes com body vazio retorna 400", async ({ request }) => {
    const response = await sendMalformedJsonWithAuth(request, token, "/api/inscricoes", "{}");
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/register com body vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/login com body vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/conversas/{id}/mensagem com conteudo vazio retorna 400", async ({ request }) => {
    const response = await request.post(`${API_URL}/api/conversas/999999/mensagem`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { conteudo: "" },
    });
    expect(response.status()).toBe(400);
  });
});
