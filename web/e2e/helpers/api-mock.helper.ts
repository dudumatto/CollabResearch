import { expect, type Page, type Route } from "@playwright/test";

type MockUser = {
  id: number;
  nome: string;
  email: string;
  tipo: "ALUNO" | "ORIENTADOR";
  curso?: string;
  instituicao?: string;
  semestre?: string;
  departamento?: string;
  titulacao?: string;
  bio?: string;
};

type MockOptions = {
  user?: MockUser;
  empty?: Partial<Record<"projects" | "applications" | "documents" | "notifications" | "conversations" | "progress" | "feedbacks", boolean>>;
  fail?: Array<string | RegExp>;
};

const jsonHeaders = { "Content-Type": "application/json" };

export const mockUsers = {
  student: {
    id: 1,
    nome: "Aluno E2E",
    email: "aluno.e2e@universidade.br",
    tipo: "ALUNO",
    curso: "Ciencia da Computacao",
    instituicao: "Universidade E2E",
    semestre: "5o Semestre",
    bio: "Pesquisa em sistemas web.",
  } satisfies MockUser,
  advisor: {
    id: 2,
    nome: "Prof Ana Orientadora",
    email: "ana.orientadora@universidade.br",
    tipo: "ORIENTADOR",
    departamento: "Computacao",
    titulacao: "Doutora",
  } satisfies MockUser,
  collaborator: {
    id: 3,
    nome: "Aluno Colaborador",
    email: "colaborador.e2e@universidade.br",
    tipo: "ALUNO",
    curso: "Sistemas de Informacao",
    instituicao: "Universidade E2E",
    semestre: "6o Semestre",
  } satisfies MockUser,
};

const areas = [
  { id: 1, nome: "Ciencia da Computacao" },
  { id: 2, nome: "Engenharia de Software" },
];

const cursos = [
  { id: 1, nome: "Ciencia da Computacao" },
  { id: 2, nome: "Sistemas de Informacao" },
];

function base64Url(input: string): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function createMockJwt(user: MockUser): string {
  return [
    base64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
    base64Url(JSON.stringify({ sub: user.email, tipo: user.tipo, exp: Math.floor(Date.now() / 1000) + 3600 })),
    "e2e",
  ].join(".");
}

export async function authenticateAs(page: Page, user: MockUser = mockUsers.student): Promise<void> {
  const token = createMockJwt(user);
  await page.addInitScript((storedToken) => {
    localStorage.setItem("tcc_auth_token", storedToken);
  }, token);
}

function shouldFail(url: URL, options: MockOptions): boolean {
  const target = `${url.pathname}${url.search}`;
  return (options.fail ?? []).some((rule) => {
    if (typeof rule === "string") return target.includes(rule);
    return rule.test(target);
  });
}

async function readJson(route: Route): Promise<Record<string, unknown>> {
  try {
    return (await route.request().postDataJSON()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function textList(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  }
  return String(value ?? "");
}

async function fulfill(route: Route, status: number, body?: unknown): Promise<void> {
  await route.fulfill({
    status,
    headers: jsonHeaders,
    body: body === undefined ? "" : JSON.stringify(body),
  });
}

export async function setupApiMock(page: Page, options: MockOptions = {}) {
  const state = {
    currentUser: options.user ?? mockUsers.student,
    users: [mockUsers.student, mockUsers.advisor],
    projects: options.empty?.projects ? [] : [
      {
        id: 1,
        titulo: "Projeto E2E Autoria",
        descricao: "Pesquisa do aluno autenticado para testes de edicao.",
        requisitos: "React, testes automatizados",
        areaId: 1,
        areaNome: "Ciencia da Computacao",
        cursoNome: "Ciencia da Computacao",
        vagas: 2,
        status: "ABERTO",
        dataCriacao: "2026-05-01T12:00:00.000Z",
        alunoCriadorId: 1,
        alunoCriadorNome: "Aluno E2E",
        orientadorId: 2,
        orientadorNome: "Prof Ana Orientadora",
        orientadorEmail: "ana.orientadora@universidade.br",
      },
      {
        id: 2,
        titulo: "Projeto E2E Candidatura",
        descricao: "Projeto aberto para fluxo de inscrição.",
        requisitos: "Python, estatistica",
        areaId: 2,
        areaNome: "Engenharia de Software",
        cursoNome: "Sistemas de Informacao",
        vagas: 3,
        status: "ABERTO",
        dataCriacao: "2026-05-03T12:00:00.000Z",
        alunoCriadorId: 99,
        alunoCriadorNome: "Aluno Dono",
        orientadorId: 2,
        orientadorNome: "Prof Ana Orientadora",
        orientadorEmail: "ana.orientadora@universidade.br",
      },
    ],
    applications: options.empty?.applications ? [] : [
      {
        id: 10,
        status: "PENDENTE",
        motivacao: "Quero participar deste projeto.",
        parecerOrientador: "",
        dataInscricao: "2026-05-05T12:00:00.000Z",
        dataAtualizacao: "2026-05-05T12:00:00.000Z",
        projeto: null as unknown,
        aluno: { usuario: mockUsers.student },
        alunoNome: "Aluno E2E",
      },
      {
        id: 11,
        status: "APROVADO",
        motivacao: "Experiencia previa.",
        parecerOrientador: "Boa aderencia ao projeto.",
        dataInscricao: "2026-05-04T12:00:00.000Z",
        dataAtualizacao: "2026-05-06T12:00:00.000Z",
        projeto: null as unknown,
        aluno: { usuario: mockUsers.student },
        alunoNome: "Aluno E2E",
      },
      {
        id: 12,
        status: "REJEITADO",
        motivacao: "Tenho interesse.",
        parecerOrientador: "Vagas encerradas.",
        dataInscricao: "2026-05-02T12:00:00.000Z",
        dataAtualizacao: "2026-05-07T12:00:00.000Z",
        projeto: null as unknown,
        aluno: { usuario: mockUsers.student },
        alunoNome: "Aluno E2E",
      },
    ],
    documents: options.empty?.documents ? [] : [
      {
        id: 20,
        nomeArquivo: "historico-e2e.pdf",
        tipo: "HISTORICO",
        status: "VERIFICADO",
        dataEnvio: "2026-05-06T12:00:00.000Z",
      },
    ],
    notifications: options.empty?.notifications ? [] : [
      {
        id: 30,
        titulo: "Inscrição aprovada",
        mensagem: "Sua inscrição foi aprovada.",
        tipo: "INSCRICAO_APROVADA",
        lida: false,
        dataCriacao: new Date().toISOString(),
      },
      {
        id: 31,
        titulo: "Nova mensagem",
        mensagem: "Você recebeu uma nova mensagem.",
        tipo: "MENSAGEM_RECEBIDA",
        lida: true,
        dataCriacao: "2026-05-07T12:00:00.000Z",
      },
    ],
    progress: options.empty?.progress ? [] : [
      {
        id: 40,
        descricao: "Levantamento bibliográfico concluído.",
        dataRegistro: "2026-05-08T12:00:00.000Z",
        usuario: mockUsers.student,
      },
    ],
    feedbacks: options.empty?.feedbacks ? [] : [
      {
        id: 50,
        nota: 5,
        comentario: "Excelente evolucao.",
        dataCriacao: "2026-05-09T12:00:00.000Z",
        projeto: null as unknown,
        usuario: mockUsers.advisor,
      },
    ],
    conversations: options.empty?.conversations ? [] : [
      {
        id: 60,
        titulo: "Projeto E2E Candidatura",
        tipo: "GRUPO",
        ultimaMensagem: "Vamos revisar os próximos passos.",
        ultimaMensagemHorario: "2026-05-10T12:00:00.000Z",
      },
    ],
    messages: [
      {
        id: 70,
        conteudo: "Vamos revisar os próximos passos.",
        remetenteId: 2,
        remetenteNome: "Prof Ana Orientadora",
        dataEnvio: "2026-05-10T12:00:00.000Z",
        editada: false,
      },
      {
        id: 71,
        conteudo: "Combinado.",
        remetenteId: 1,
        remetenteNome: "Aluno E2E",
        dataEnvio: "2026-05-10T12:05:00.000Z",
        editada: false,
      },
    ],
  };

  if (state.applications[0] && state.projects[1]) state.applications[0].projeto = state.projects[1];
  if (state.applications[1] && state.projects[0]) state.applications[1].projeto = state.projects[0];
  if (state.applications[2] && state.projects[1]) state.applications[2].projeto = state.projects[1];
  if (state.feedbacks[0] && state.projects[0]) state.feedbacks[0].projeto = state.projects[0];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (shouldFail(url, options)) {
      await fulfill(route, 500, { message: "Falha simulada pela API E2E." });
      return;
    }

    if (method === "POST" && path === "/api/auth/login") {
      const body = await readJson(route);
      if (body.email === "erro@universidade.br" || body.senha === "senha-incorreta") {
        await fulfill(route, 401, { message: "Credenciais invalidas." });
        return;
      }
      state.currentUser = {
        ...mockUsers.student,
        email: String(body.email ?? mockUsers.student.email),
      };
      state.users = [state.currentUser, mockUsers.advisor];
      await fulfill(route, 200, { token: createMockJwt(state.currentUser), usuario: state.currentUser });
      return;
    }

    if (method === "POST" && path === "/api/auth/register") {
      const body = await readJson(route);
      if (!body.nome || !body.email || !body.senha || !body.ra) {
        await fulfill(route, 400, { message: "Dados obrigatorios ausentes." });
        return;
      }
      state.currentUser = {
        ...mockUsers.student,
        id: 100,
        nome: String(body.nome),
        email: String(body.email),
      };
      state.users = [state.currentUser, mockUsers.advisor];
      await fulfill(route, 200, { token: createMockJwt(state.currentUser), usuario: state.currentUser });
      return;
    }

    if (method === "POST" && path === "/api/auth/logout") {
      await fulfill(route, 204);
      return;
    }

    if (method === "GET" && path === "/api/areas") {
      await fulfill(route, 200, areas);
      return;
    }

    if (method === "GET" && path === "/api/cursos") {
      await fulfill(route, 200, cursos);
      return;
    }

    if (method === "GET" && path === "/api/usuarios/me") {
      await fulfill(route, 200, state.currentUser);
      return;
    }

    if (method === "GET" && path === "/api/usuarios") {
      await fulfill(route, 200, state.users);
      return;
    }

    if (method === "GET" && path === "/api/usuarios/orientadores") {
      await fulfill(route, 200, [mockUsers.advisor]);
      return;
    }

    const userProjectMatch = path.match(/^\/api\/usuarios\/(\d+)\/projetos$/);
    if (method === "GET" && userProjectMatch) {
      await fulfill(route, 200, options.empty?.projects ? [] : state.projects);
      return;
    }

    const userApplicationsMatch = path.match(/^\/api\/usuarios\/(\d+)\/inscricoes$/);
    if (method === "GET" && userApplicationsMatch) {
      await fulfill(route, 200, state.applications);
      return;
    }

    const userDocumentsMatch = path.match(/^\/api\/documentos\/usuario\/(\d+)$/);
    if (method === "GET" && userDocumentsMatch) {
      await fulfill(route, 200, state.documents);
      return;
    }

    const userMatch = path.match(/^\/api\/usuarios\/(\d+)$/);
    if (method === "GET" && userMatch) {
      const user = state.users.find((item) => item.id === Number(userMatch[1])) ?? state.currentUser;
      await fulfill(route, 200, user);
      return;
    }

    if (method === "PUT" && userMatch) {
      const body = await readJson(route);
      state.currentUser = { ...state.currentUser, ...body };
      await fulfill(route, 200, state.currentUser);
      return;
    }

    if (method === "GET" && path === "/api/projetos") {
      const busca = (url.searchParams.get("busca") ?? "").toLowerCase();
      const status = url.searchParams.get("status") ?? "";
      const projects = state.projects.filter((project) => {
        const matchesSearch = !busca || project.titulo.toLowerCase().includes(busca) || project.descricao.toLowerCase().includes(busca);
        const matchesStatus = !status || project.status === status;
        return matchesSearch && matchesStatus;
      });
      await fulfill(route, 200, projects);
      return;
    }

    if (method === "POST" && path === "/api/projetos") {
      const body = await readJson(route);
      const project = {
        id: Math.max(0, ...state.projects.map((item) => item.id)) + 1,
        titulo: String(body.titulo),
        descricao: String(body.descricao ?? ""),
        requisitos: textList(body.requisitos),
        tecnologias: textList(body.tecnologias ?? body.competencias),
        areaId: Number(body.areaId),
        areaNome: areas.find((item) => item.id === Number(body.areaId))?.nome ?? "Ciencia da Computacao",
        cursoNome: String(body.curso ?? "Ciencia da Computacao"),
        vagas: Number(body.vagas ?? 1),
        status: "ABERTO",
        dataCriacao: new Date().toISOString(),
        alunoCriadorId: state.currentUser.id,
        alunoCriadorNome: state.currentUser.nome,
        orientadorId: Number(body.orientadorId ?? mockUsers.advisor.id),
        orientadorNome: mockUsers.advisor.nome,
        orientadorEmail: mockUsers.advisor.email,
      };
      state.projects.unshift(project);
      await fulfill(route, 200, project);
      return;
    }

    const projectMatch = path.match(/^\/api\/projetos\/(\d+)$/);
    if (projectMatch && method === "GET") {
      const project = state.projects.find((item) => item.id === Number(projectMatch[1]));
      await fulfill(route, project ? 200 : 404, project ?? { message: "Projeto não encontrado." });
      return;
    }

    if (projectMatch && method === "PUT") {
      const body = await readJson(route);
      const index = state.projects.findIndex((item) => item.id === Number(projectMatch[1]));
      if (index < 0) {
        await fulfill(route, 404, { message: "Projeto não encontrado." });
        return;
      }
      state.projects[index] = {
        ...state.projects[index],
        titulo: String(body.titulo ?? state.projects[index].titulo),
        descricao: String(body.descricao ?? state.projects[index].descricao),
        requisitos: textList(body.requisitos ?? state.projects[index].requisitos),
        tecnologias: textList(body.tecnologias ?? state.projects[index].tecnologias),
        areaId: Number(body.areaId ?? state.projects[index].areaId),
        vagas: Number(body.vagas ?? state.projects[index].vagas),
      };
      await fulfill(route, 200, state.projects[index]);
      return;
    }

    if (projectMatch && method === "DELETE") {
      state.projects = state.projects.filter((item) => item.id !== Number(projectMatch[1]));
      await fulfill(route, 204);
      return;
    }

    const projectProgressMatch = path.match(/^\/api\/projetos\/(\d+)\/progresso$/);
    if (projectProgressMatch && method === "GET") {
      await fulfill(route, 200, state.progress);
      return;
    }

    if (projectProgressMatch && method === "POST") {
      const body = await readJson(route);
      state.progress.unshift({
        id: Math.max(0, ...state.progress.map((item) => item.id)) + 1,
        descricao: String(body.descricao),
        dataRegistro: new Date().toISOString(),
        usuario: state.currentUser,
      });
      await fulfill(route, 200, state.progress[0]);
      return;
    }

    const collaboratorsMatch = path.match(/^\/api\/projetos\/(\d+)\/colaboradores$/);
    if (collaboratorsMatch && method === "GET") {
      const projectId = Number(collaboratorsMatch[1]);
      const collaborators = projectId === 2
        ? [mockUsers.advisor, mockUsers.student, mockUsers.collaborator]
        : [mockUsers.advisor, mockUsers.student];
      await fulfill(route, 200, collaborators);
      return;
    }

    const removeCollaboratorMatch = path.match(/^\/api\/projetos\/(\d+)\/colaboradores\/(\d+)$/);
    if (removeCollaboratorMatch && method === "DELETE") {
      await fulfill(route, 204);
      return;
    }

    const recruitMatch = path.match(/^\/api\/projetos\/(\d+)\/recrutar$/);
    if (recruitMatch && method === "POST") {
      await fulfill(route, 200, { ok: true });
      return;
    }

    if (method === "GET" && path === "/api/usuarios/minhas-inscricoes") {
      await fulfill(route, 200, state.applications);
      return;
    }

    if (method === "POST" && path === "/api/inscricoes") {
      const body = await readJson(route);
      const project = state.projects.find((item) => item.id === Number(body.projetoId));
      const application = {
        id: Math.max(0, ...state.applications.map((item) => item.id)) + 1,
        status: "PENDENTE",
        motivacao: String(body.motivacao ?? ""),
        parecerOrientador: "",
        dataInscricao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        projeto: project,
        aluno: { usuario: state.currentUser },
        alunoNome: state.currentUser.nome,
      };
      state.applications.unshift(application);
      await fulfill(route, 200, application);
      return;
    }

    const projectApplicationsMatch = path.match(/^\/api\/inscricoes\/projeto\/(\d+)$/);
    if (projectApplicationsMatch && method === "GET") {
      const projectId = Number(projectApplicationsMatch[1]);
      await fulfill(route, 200, state.applications.filter((item) => item.projeto?.id === projectId));
      return;
    }

    const approveMatch = path.match(/^\/api\/inscricoes\/(\d+)\/aprovar$/);
    if (approveMatch && method === "PUT") {
      state.applications = state.applications.map((item) => item.id === Number(approveMatch[1]) ? { ...item, status: "APROVADO" } : item);
      await fulfill(route, 200, { ok: true });
      return;
    }

    const rejectMatch = path.match(/^\/api\/inscricoes\/(\d+)\/rejeitar$/);
    if (rejectMatch && method === "PUT") {
      state.applications = state.applications.map((item) => item.id === Number(rejectMatch[1]) ? { ...item, status: "REJEITADO" } : item);
      await fulfill(route, 200, { ok: true });
      return;
    }

    const cancelMatch = path.match(/^\/api\/inscricoes\/(\d+)\/cancelar$/);
    if (cancelMatch && method === "DELETE") {
      state.applications = state.applications.filter((item) => item.id !== Number(cancelMatch[1]));
      await fulfill(route, 204);
      return;
    }

    if (method === "GET" && path === "/api/notificacoes") {
      await fulfill(route, 200, state.notifications);
      return;
    }

    if (method === "PUT" && path === "/api/notificacoes/ler-todas") {
      state.notifications = state.notifications.map((item) => ({ ...item, lida: true }));
      await fulfill(route, 200, state.notifications);
      return;
    }

    const notificationMatch = path.match(/^\/api\/notificacoes\/(\d+)\/ler$/);
    if (notificationMatch && method === "PUT") {
      state.notifications = state.notifications.map((item) => item.id === Number(notificationMatch[1]) ? { ...item, lida: true } : item);
      await fulfill(route, 200, { ok: true });
      return;
    }

    if (method === "POST" && path === "/api/documentos/upload") {
      state.documents.unshift({
        id: Math.max(0, ...state.documents.map((item) => item.id)) + 1,
        nomeArquivo: "upload-e2e.pdf",
        tipo: "HISTORICO",
        status: "ENVIADO",
        dataEnvio: new Date().toISOString(),
      });
      await fulfill(route, 200, state.documents[0]);
      return;
    }

    const documentMatch = path.match(/^\/api\/documentos\/(\d+)$/);
    if (documentMatch && method === "DELETE") {
      state.documents = state.documents.filter((item) => item.id !== Number(documentMatch[1]));
      await fulfill(route, 204);
      return;
    }

    const feedbackByProjectMatch = path.match(/^\/api\/feedback\/projeto\/(\d+)$/);
    if (feedbackByProjectMatch && method === "GET") {
      await fulfill(route, 200, state.feedbacks);
      return;
    }

    const feedbackByUserMatch = path.match(/^\/api\/feedback\/usuario\/(\d+)$/);
    if (feedbackByUserMatch && method === "GET") {
      await fulfill(route, 200, state.feedbacks);
      return;
    }

    if (method === "POST" && path === "/api/feedback") {
      const body = await readJson(route);
      const feedback = {
        id: Math.max(0, ...state.feedbacks.map((item) => item.id)) + 1,
        nota: Number(body.nota),
        comentario: String(body.comentario),
        dataCriacao: new Date().toISOString(),
        projeto: state.projects.find((item) => item.id === Number(body.projetoId)),
        usuario: state.currentUser,
      };
      state.feedbacks.unshift(feedback);
      await fulfill(route, 200, feedback);
      return;
    }

    const conversationsMatch = path.match(/^\/api\/conversas\/(\d+)\/todas$/);
    if (conversationsMatch && method === "GET") {
      await fulfill(route, 200, state.conversations);
      return;
    }

    const privateConversationMatch = path.match(/^\/api\/conversas\/privada\/(\d+)$/);
    if (privateConversationMatch && method === "POST") {
      const conversation = { id: 61, titulo: "Prof Ana Orientadora", tipo: "PRIVADA", ultimaMensagem: "", ultimaMensagemHorario: null };
      state.conversations.unshift(conversation);
      await fulfill(route, 200, conversation);
      return;
    }

    const messagesMatch = path.match(/^\/api\/conversas\/(\d+)\/mensagens$/);
    if (messagesMatch && method === "GET") {
      await fulfill(route, 200, state.messages);
      return;
    }

    const sendMessageMatch = path.match(/^\/api\/conversas\/(\d+)\/mensagem$/);
    if (sendMessageMatch && method === "POST") {
      const body = await readJson(route);
      state.messages.push({
        id: Math.max(0, ...state.messages.map((item) => Number(item.id))) + 1,
        conteudo: String(body.conteudo),
        remetenteId: state.currentUser.id,
        remetenteNome: state.currentUser.nome,
        dataEnvio: new Date().toISOString(),
        editada: false,
      });
      await fulfill(route, 200, state.messages[state.messages.length - 1]);
      return;
    }

    const editMessageMatch = path.match(/^\/api\/conversas\/mensagem\/(\d+)$/);
    if (editMessageMatch && method === "PUT") {
      const body = await readJson(route);
      const message = state.messages.find((item) => item.id === Number(editMessageMatch[1]));
      if (message) {
        message.conteudo = String(body.conteudo);
        message.editada = true;
      }
      await fulfill(route, 200, message);
      return;
    }

    if (editMessageMatch && method === "DELETE") {
      state.messages = state.messages.filter((item) => item.id !== Number(editMessageMatch[1]));
      await fulfill(route, 204);
      return;
    }

    await fulfill(route, 404, { message: `Rota mock não mapeada: ${method} ${path}` });
  });

  return state;
}

export async function expectToast(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}
