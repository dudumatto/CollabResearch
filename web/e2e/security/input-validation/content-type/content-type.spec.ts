import { test, expect } from "@playwright/test";
import { prepareValidationUser, sendWrongContentType } from "../payloads.helper";
import { API_URL } from "../../../helpers/api.helper";

test.describe("content-type inválido", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await prepareValidationUser(request);
    token = user.token;
  });

  const wrongContentTypes = [
    "text/plain",
    "application/xml",
    "text/html",
    "application/x-www-form-urlencoded",
  ];

  for (const contentType of wrongContentTypes) {
    test(`POST /api/projetos com Content-Type ${contentType} não retorna 500`, async ({ request }) => {
      const body = JSON.stringify({ titulo: "Teste", vagas: 1, areaId: 1 });
      const response = await sendWrongContentType(request, token, "/api/projetos", contentType, body);
      expect(response.status(), `Content-Type ${contentType} retornou 500`).not.toBe(500);
    });
  }

  for (const contentType of wrongContentTypes) {
    test(`POST /api/feedback com Content-Type ${contentType} não retorna 500`, async ({ request }) => {
      const body = JSON.stringify({ projetoId: 1, nota: 5, comentario: "Teste" });
      const response = await sendWrongContentType(request, token, "/api/feedback", contentType, body);
      expect(response.status(), `Content-Type ${contentType} retornou 500`).not.toBe(500);
    });
  }

  test("POST /api/auth/login com Content-Type text/plain não retorna 500", async ({ request }) => {
    const body = JSON.stringify({ email: "test@test.com", senha: "12345678" });
    const response = await sendWrongContentType(request, "", "/api/auth/login", "text/plain", body);
    expect(response.status()).not.toBe(500);
  });
});
