import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, type AuthenticatedUser } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";

export type DocumentScenario = {
  owner: AuthenticatedUser;
  outsider: AuthenticatedUser;
  documentId: number;
};

export async function prepareDocumentScenario(request: APIRequestContext): Promise<DocumentScenario> {
  const owner = await registerAndLogin(request, "ac-doc-owner");
  const outsider = await registerAndLogin(request, "ac-doc-outsider");

  const uploadRes = await request.post(`${API_URL}/api/documentos/upload`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: {
      usuarioId: owner.id,
      tipo: "HISTORICO",
      nomeArquivo: "documento-teste-e2e.pdf",
      url: "https://abcdef.supabase.co/storage/v1/object/public/test/test.pdf",
    },
  });
  expect(uploadRes.ok(), `Failed to upload document: ${await uploadRes.text()}`).toBeTruthy();
  const doc = await uploadRes.json();
  const documentId = Number(doc.id);
  expect(documentId).toBeGreaterThan(0);

  return { owner, outsider, documentId };
}

export async function listUserDocuments(request: APIRequestContext, token: string, userId: number) {
  return request.get(`${API_URL}/api/documentos/usuario/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteDocument(request: APIRequestContext, token: string, documentId: number) {
  return request.delete(`${API_URL}/api/documentos/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function downloadDocument(request: APIRequestContext, token: string, documentId: number) {
  return request.get(`${API_URL}/api/documentos/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    maxRedirects: 0,
  });
}
