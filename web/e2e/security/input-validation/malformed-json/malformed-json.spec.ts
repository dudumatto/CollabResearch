import { test, expect } from "@playwright/test";
import { prepareValidationUser, malformedJsonPayloads, sendMalformedJsonWithAuth } from "../payloads.helper";

test.describe("malformed JSON", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await prepareValidationUser(request);
    token = user.token;
  });

  const endpoints = [
    { path: "/api/projetos", method: "POST" },
    { path: "/api/feedback", method: "POST" },
    { path: "/api/inscricoes", method: "POST" },
  ];

  for (const endpoint of endpoints) {
    for (const payload of malformedJsonPayloads()) {
      test(`${endpoint.method} ${endpoint.path} com JSON malformado "${payload.slice(0, 30)}..." não retorna 500`, async ({ request }) => {
        const response = await sendMalformedJsonWithAuth(request, token, endpoint.path, payload);
        expect(response.status(), `Status inesperado para payload: ${payload}`).not.toBe(500);
      });
    }
  }
});
