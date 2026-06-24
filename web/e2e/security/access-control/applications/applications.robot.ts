import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, registerAndLoginOrientador, type AuthenticatedUser } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";

export type ApplicationScenario = {
  owner: AuthenticatedUser;
  learner: AuthenticatedUser;
  outsider: AuthenticatedUser;
  orientador: AuthenticatedUser;
  projectId: number;
  inscriptionId: number;
};

export async function prepareApplicationScenario(request: APIRequestContext): Promise<ApplicationScenario> {
  const owner = await registerAndLogin(request, "ac-app-owner");
  const learner = await registerAndLogin(request, "ac-app-learner");
  const outsider = await registerAndLogin(request, "ac-app-outsider");
  const orientador = await registerAndLoginOrientador(request, "ac-app-orient");

  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${owner.token}` },
  });
  const areas = await areasRes.json();

  const draft = buildProjectCandidate();
  const createRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      vagas: draft.slots,
      areaId: areas[0]?.id,
      orientadorId: orientador.id,
    },
  });
  const project = await createRes.json();
  const projectId = Number(project.id);

  const acceptRes = await request.put(`${API_URL}/api/projetos/${projectId}/aceitar-orientacao`, {
    headers: { Authorization: `Bearer ${orientador.token}` },
  });
  expect(acceptRes.ok(), `Failed to accept project: ${await acceptRes.text()}`).toBeTruthy();

  const applyRes = await request.post(`${API_URL}/api/inscricoes`, {
    headers: { Authorization: `Bearer ${learner.token}` },
    data: { projetoId: projectId, motivacao: "Inscrição de teste E2E" },
  });
  expect(applyRes.ok(), `Failed to apply: ${await applyRes.text()}`).toBeTruthy();
  const inscription = await applyRes.json();
  const inscriptionId = Number(inscription.id);

  return { owner, learner, outsider, orientador, projectId, inscriptionId };
}

export async function approveInscription(request: APIRequestContext, token: string, inscriptionId: number) {
  return request.put(`${API_URL}/api/inscricoes/${inscriptionId}/aprovar`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { parecerOrientador: "Aprovado" },
  });
}

export async function rejectInscription(request: APIRequestContext, token: string, inscriptionId: number) {
  return request.put(`${API_URL}/api/inscricoes/${inscriptionId}/rejeitar`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { parecerOrientador: "Rejeitado" },
  });
}

export async function cancelInscription(request: APIRequestContext, token: string, inscriptionId: number) {
  return request.delete(`${API_URL}/api/inscricoes/${inscriptionId}/cancelar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getInscription(request: APIRequestContext, token: string, inscriptionId: number) {
  return request.get(`${API_URL}/api/inscricoes/${inscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
