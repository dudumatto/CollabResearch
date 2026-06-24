import { test, expect } from "@playwright/test";
import { prepareValidationUser, invalidIds, sendGetWithInvalidId, sendDeleteWithInvalidId } from "../payloads.helper";

test.describe("IDs inválidos", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await prepareValidationUser(request);
    token = user.token;
  });

  const resources = [
    { path: "/api/projetos", name: "projetos", methods: ["GET"] as const },
    { path: "/api/documentos", name: "documentos", methods: ["GET"] as const },
    { path: "/api/inscricoes", name: "inscricoes", methods: ["GET"] as const },
    { path: "/api/usuarios", name: "usuarios", methods: ["GET"] as const },
  ];

  for (const resource of resources) {
    for (const id of invalidIds()) {
      for (const method of resource.methods) {
        test(`GET ${resource.path}/${id} não retorna 500`, async ({ request }) => {
          const response = await sendGetWithInvalidId(request, token, resource.path, id);
          expect(response.status(), `GET ${resource.path}/${id} retornou 500`).not.toBe(500);
          expect([200, 400, 403, 404]).toContain(response.status());
        });
      }
    }
  }

  for (const id of invalidIds()) {
    test(`DELETE /api/projetos/${id} não retorna 500`, async ({ request }) => {
      const response = await sendDeleteWithInvalidId(request, token, "/api/projetos", id);
      expect(response.status(), `DELETE /api/projetos/${id} retornou 500`).not.toBe(500);
      expect([200, 204, 400, 403, 404]).toContain(response.status());
    });
  }
});
