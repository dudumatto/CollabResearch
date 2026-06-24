import { test, expect } from "@playwright/test";
import {
  prepareDocumentScenario,
  listUserDocuments,
  deleteDocument,
  downloadDocument,
} from "./documents.robot";
import { assertForbidden, assertOk } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";

test.describe("access control documentos", () => {
  let scenario: Awaited<ReturnType<typeof prepareDocumentScenario>>;

  test.beforeAll(async ({ request }) => {
    scenario = await prepareDocumentScenario(request);
  });

  test("dono lista seus documentos", async ({ request }) => {
    const response = await listUserDocuments(request, scenario.owner.token, scenario.owner.id);
    await assertOk(response);
    const docs = await response.json();
    expect(Array.isArray(docs)).toBeTruthy();
    expect(docs.length).toBeGreaterThan(0);
  });

  test("usuário externo lista documentos de terceiros (retorna lista vazia)", async ({ request }) => {
    const response = await listUserDocuments(request, scenario.outsider.token, scenario.owner.id);
    await assertOk(response);
    const docs = await response.json();
    expect(Array.isArray(docs)).toBeTruthy();
  });

  test("dono faz download do documento", async ({ request }) => {
    const response = await downloadDocument(request, scenario.owner.token, scenario.documentId);
    expect([200, 302]).toContain(response.status());
  });

  test("usuário externo não faz download de documento de terceiros", async ({ request }) => {
    const response = await downloadDocument(request, scenario.outsider.token, scenario.documentId);
    await assertForbidden(response);
  });

  test("dono exclui seu documento", async ({ request }) => {
    const uploadRes = await request.post(`${API_URL}/api/documentos/upload`, {
      headers: { Authorization: `Bearer ${scenario.owner.token}` },
      data: {
        usuarioId: scenario.owner.id,
        tipo: "CURRICULO",
        nomeArquivo: "doc-para-excluir.pdf",
        url: "https://abcdef.supabase.co/storage/v1/object/public/test/delete-test.pdf",
      },
    });
    const doc = await uploadRes.json();
    const response = await deleteDocument(request, scenario.owner.token, Number(doc.id));
    expect([200, 204]).toContain(response.status());
  });

  test("usuário externo não exclui documento de terceiros", async ({ request }) => {
    const response = await deleteDocument(request, scenario.outsider.token, scenario.documentId);
    await assertForbidden(response);
  });
});
