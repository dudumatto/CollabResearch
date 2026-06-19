import { expect, type APIRequestContext } from "@playwright/test";
import {
  buildProjectDraft,
  buildTestUser,
  type ProjectDraft,
  type TestUser,
} from "./test-data.helper";

export const API_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:8080";

type CatalogItem = {
  id: number;
  nome: string;
};

type CreatedProject = {
  id: number;
  titulo: string;
  tecnologias?: string;
  alunoCriadorNome?: string;
};

type Advisor = {
  id: number;
  nome: string;
};

export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async expectHealthyApi(): Promise<void> {
    const registerProbe = await this.request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: "",
        email: "invalid",
        senha: "123",
        ra: "",
      },
    });

    expect(registerProbe.status(), "backend should respond to auth API").toBe(400);
  }

  async registerUser(prefix: string, name = "Usuario E2E"): Promise<TestUser> {
    const user = buildTestUser(prefix, name);
    const response = await this.request.post(`${API_URL}/api/auth/register`, {
      data: {
        nome: user.nome,
        email: user.email,
        senha: user.senha,
        ra: user.ra,
      },
    });

    expect(response.status(), await response.text()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();

    return {
      ...user,
      token: body.token,
      user: body.usuario ?? body.user,
    };
  }

  async get<T>(path: string, token: string): Promise<T> {
    const response = await this.request.get(`${API_URL}${path}`, {
      headers: this.authHeaders(token),
    });

    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, token: string, data?: unknown): Promise<T> {
    const response = await this.request.post(`${API_URL}${path}`, {
      headers: this.authHeaders(token),
      data,
    });

    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response.json() as Promise<T>;
  }

  async getCatalogs(token: string): Promise<{ areas: CatalogItem[]; cursos: CatalogItem[] }> {
    const areas = await this.get<CatalogItem[]>("/api/areas", token);
    const cursos = await this.get<CatalogItem[]>("/api/cursos", token);

    expect(areas[0]).toEqual(expect.objectContaining({ id: expect.any(Number), nome: expect.any(String) }));

    return { areas, cursos };
  }

  async getAdvisors(token: string): Promise<Advisor[]> {
    const advisors = await this.get<Advisor[]>("/api/usuarios/orientadores", token);
    expect(advisors[0]).toEqual(expect.objectContaining({ id: expect.any(Number), nome: expect.any(String) }));
    return advisors;
  }

  async createProject(token: string, draft: ProjectDraft = buildProjectDraft()): Promise<CreatedProject> {
    const { areas, cursos } = await this.getCatalogs(token);
    const advisors = await this.getAdvisors(token);
    const firstCourse = cursos[0]?.nome ?? "Ciencia da Computacao";
    const created = await this.post<CreatedProject>("/api/projetos", token, {
      titulo: draft.title,
      descricao: draft.description,
      requisitos: draft.requirements,
      tecnologias: draft.technologies,
      areaId: areas[0].id,
      curso: firstCourse,
      vagas: draft.slots,
      orientadorId: advisors[0].id,
    });

    expect(created.id).toBeGreaterThan(0);
    return created;
  }

  async expectProject(projectId: number, token: string, title: string, ownerName: string): Promise<void> {
    const project = await this.get<CreatedProject>(`/api/projetos/${projectId}`, token);

    expect(project.titulo).toBe(title);
    expect(project.alunoCriadorNome).toBe(ownerName);
  }

  async getMyApplications(token: string): Promise<Array<{ projeto?: { id?: number }; projetoId?: number }>> {
    return this.get("/api/usuarios/minhas-inscricoes", token);
  }

  async logout(token: string): Promise<void> {
    const response = await this.request.post(`${API_URL}/api/auth/logout`, {
      headers: this.authHeaders(token),
    });

    expect(response.ok(), await response.text()).toBeTruthy();
  }

  async expectTokenRevoked(token: string): Promise<void> {
    const response = await this.request.get(`${API_URL}/api/usuarios/me`, {
      headers: this.authHeaders(token),
    });

    expect(response.status()).toBe(401);
  }

  private authHeaders(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }
}
