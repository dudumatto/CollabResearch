import { expect, type APIRequestContext } from "@playwright/test";
import { registerAndLogin, registerAndLoginOrientador, type AuthenticatedUser } from "../../helpers/security.helper";
import { API_URL } from "../../../helpers/api.helper";
import { buildProjectCandidate } from "../../../factories/project.factory";

export type ProjectScenario = {
  owner: AuthenticatedUser;
  collaborator: AuthenticatedUser;
  outsider: AuthenticatedUser;
  projectId: number;
};

export async function prepareProjectScenario(request: APIRequestContext): Promise<ProjectScenario> {
  const owner = await registerAndLogin(request, "ac-project-owner");
  const collaborator = await registerAndLogin(request, "ac-project-collab");
  const outsider = await registerAndLogin(request, "ac-project-outsider");
  const orientador = await registerAndLoginOrientador(request, "ac-project-orient");

  const areasRes = await request.get(`${API_URL}/api/areas`, {
    headers: { Authorization: `Bearer ${owner.token}` },
  });
  expect(areasRes.ok()).toBeTruthy();
  const areas = await areasRes.json();
  const areaId = areas[0]?.id;

  const draft = buildProjectCandidate();
  const createRes = await request.post(`${API_URL}/api/projetos`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      tecnologias: draft.technologies,
      vagas: draft.slots,
      areaId,
      orientadorId: orientador.id,
    },
  });
  expect(createRes.ok(), `Failed to create project: ${await createRes.text()}`).toBeTruthy();
  const project = await createRes.json();
  const projectId = Number(project.id);
  expect(projectId).toBeGreaterThan(0);

  const recruitRes = await request.post(`${API_URL}/api/projetos/${projectId}/recrutar`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: { usuarioId: collaborator.id },
  });
  expect(recruitRes.ok(), `Failed to recruit collaborator: ${await recruitRes.text()}`).toBeTruthy();

  return { owner, collaborator, outsider, projectId };
}

export async function getProject(request: APIRequestContext, token: string, projectId: number) {
  return request.get(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProject(request: APIRequestContext, token: string, projectId: number) {
  return request.put(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { titulo: "Projeto Atualizado", vagas: 5, areaId: 1 },
  });
}

export async function deleteProject(request: APIRequestContext, token: string, projectId: number) {
  return request.delete(`${API_URL}/api/projetos/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listCollaborators(request: APIRequestContext, token: string, projectId: number) {
  return request.get(`${API_URL}/api/projetos/${projectId}/colaboradores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
