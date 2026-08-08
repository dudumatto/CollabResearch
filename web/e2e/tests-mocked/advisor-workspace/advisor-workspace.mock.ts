import { type Page, type Route } from "@playwright/test";
import { mockUsers } from "../../helpers/api-mock.helper";

const jsonHeaders = { "Content-Type": "application/json" };

const agora = "2026-06-01T12:00:00.000Z";

const advisorUser = mockUsers.advisor;

const projects = [
  {
    id: 1,
    titulo: "Projeto E2E Autoria",
    descricao: "Pesquisa sob orientacao da professora.",
    requisitos: "React, testes automatizados",
    tecnologias: "React, Playwright",
    areaId: 1,
    areaNome: "Ciencia da Computacao",
    cursoNome: "Ciencia da Computacao",
    vagas: 2,
    status: "EM_ANDAMENTO",
    dataCriacao: agora,
    alunoCriadorId: 1,
    alunoCriadorNome: "Aluno E2E",
    orientadorId: 2,
    orientadorNome: "Prof Ana Orientadora",
    orientadorEmail: "ana.orientadora@universidade.br",
  },
  {
    id: 2,
    titulo: "Projeto E2E Candidatura",
    descricao: "Projeto aberto para novas inscricoes.",
    requisitos: "Python, estatistica",
    tecnologias: "Python",
    areaId: 2,
    areaNome: "Engenharia de Software",
    cursoNome: "Sistemas de Informacao",
    vagas: 3,
    status: "ABERTO",
    dataCriacao: agora,
    alunoCriadorId: 99,
    alunoCriadorNome: "Aluno Dono",
    orientadorId: 2,
    orientadorNome: "Prof Ana Orientadora",
    orientadorEmail: "ana.orientadora@universidade.br",
  },
  {
    id: 3,
    titulo: "Proposta de pesquisa IA",
    descricao: "Projeto proposto por aluno aguardando aceite.",
    requisitos: "IA",
    tecnologias: "Python, TensorFlow",
    areaId: 1,
    areaNome: "Ciencia da Computacao",
    cursoNome: "Ciencia da Computacao",
    vagas: 2,
    status: "PENDENTE_ORIENTADOR",
    dataCriacao: agora,
    alunoCriadorId: 4,
    alunoCriadorNome: "Aluno Propositor",
    orientadorId: null,
    orientadorNome: null,
    orientadorEmail: null,
  },
];

const dashboard = {
  metricas: {
    projetosAtivos: 1,
    solicitacoesOrientacao: 1,
    inscricoesPendentes: 1,
    orientandosAtivos: 1,
    etapasAtrasadas: 0,
    entregasAguardandoRevisao: 1,
    avaliacoesAguardandoCiencia: 1,
  },
  filas: {
    projetosAtivos: [
      { id: 1, titulo: "Projeto E2E Autoria", subtitulo: "2 participantes", status: "EM_ANDAMENTO", destino: "/app/projects/1" },
    ],
    solicitacoesOrientacao: [
      { id: 3, titulo: "Proposta de pesquisa IA", subtitulo: "Aluno Propositor", status: "PENDENTE_ORIENTADOR", destino: "/app/projects/3" },
    ],
    inscricoesPendentes: [
      { id: 10, titulo: "Aluno E2E", subtitulo: "Projeto E2E Candidatura", status: "PENDENTE", destino: "/app/applications" },
    ],
    orientandosAtivos: [
      { id: 1, titulo: "Aluno E2E", subtitulo: "Ciencia da Computacao", status: "EM_ANDAMENTO", destino: "/app/advisees/1" },
    ],
    etapasAtrasadas: [],
    entregasAguardandoRevisao: [
      { id: 1, titulo: "Monografia", subtitulo: "Aluno E2E", status: "PENDING_REVIEW", destino: "/app/deliveries" },
    ],
    avaliacoesAguardandoCiencia: [
      { id: 1, titulo: "Levantamento bibliografico", subtitulo: "Aluno E2E", status: "AGUARDANDO", destino: "/app/avaliacoes" },
    ],
  },
};

const inscricoes = [
  {
    id: 10,
    status: "PENDENTE",
    motivacao: "Quero participar deste projeto.",
    parecerOrientador: "",
    dataInscricao: agora,
    dataAtualizacao: agora,
    alunoId: 1,
    alunoNome: "Aluno E2E",
    projeto: projects[1],
  },
  {
    id: 11,
    status: "APROVADO",
    motivacao: "Experiencia previa.",
    parecerOrientador: "Boa aderencia.",
    dataInscricao: agora,
    dataAtualizacao: agora,
    alunoId: 1,
    alunoNome: "Aluno E2E",
    projeto: projects[0],
  },
];

const orientandos = [
  {
    alunoId: 1,
    alunoUsuarioId: 1,
    nome: "Aluno E2E",
    email: "aluno.e2e@universidade.br",
    ra: "2021001",
    curso: "Ciencia da Computacao",
    situacao: "EM_ANDAMENTO",
    progresso: 60,
    pendencias: 1,
    projetos: [
      { projetoId: 1, projetoTitulo: "Projeto E2E Autoria", status: "EM_ANDAMENTO" },
    ],
  },
];

const detalheOrientando = {
  alunoId: 1,
  alunoUsuarioId: 1,
  nome: "Aluno E2E",
  email: "aluno.e2e@universidade.br",
  ra: "2021001",
  curso: "Ciencia da Computacao",
  semestre: "5o Semestre",
  interesses: "Sistemas web",
  projetoSelecionado: { projetoId: 1, projetoTitulo: "Projeto E2E Autoria", status: "EM_ANDAMENTO" },
  projetos: [{ projetoId: 1, projetoTitulo: "Projeto E2E Autoria", status: "EM_ANDAMENTO" }],
  progresso: 60,
  etapas: [
    {
      id: 1,
      titulo: "Levantamento bibliografico",
      descricao: "Revisar literatura sobre o tema.",
      ordem: 1,
      peso: 20,
      obrigatoria: true,
      status: "DONE",
      responsavel: "AMBOS",
      prazo: "2026-06-10T00:00:00.000Z",
      concluidaEm: "2026-05-20T12:00:00.000Z",
      concluidaPorNome: "Aluno E2E",
    },
    {
      id: 2,
      titulo: "Prototipacao",
      descricao: "Construir prototipo inicial.",
      ordem: 2,
      peso: 30,
      obrigatoria: true,
      status: "ACTIVE",
      responsavel: "ALUNO",
      prazo: "2026-07-01T00:00:00.000Z",
      concluidaEm: null,
      concluidaPorNome: "",
    },
  ],
  historico: [
    {
      id: 1,
      titulo: "Projeto iniciado",
      descricao: "Projeto marcado como em andamento.",
      categoria: "ATUALIZACAO",
      dataRegistro: agora,
    },
  ],
};

const etapas = detalheOrientando.etapas;

const entregas = [
  {
    id: 1,
    projetoId: 1,
    etapaId: 1,
    etapaTitulo: "Levantamento bibliografico",
    autorId: 1,
    autorNome: "Aluno E2E",
    titulo: "Monografia",
    categoria: "TCC",
    status: "PENDING_REVIEW",
    criadaEm: agora,
    atualizadaEm: agora,
    ultimaVersaoId: 1,
    totalVersoes: 1,
  },
];

const versoes = [
  {
    id: 1,
    numeroVersao: 1,
    nomeArquivo: "monografia.pdf",
    contentType: "application/pdf",
    tamanhoBytes: 12345,
    enviadaEm: agora,
    revisao: null,
  },
];

const avaliacoes = [
  {
    id: 1,
    projetoId: 1,
    etapaId: 1,
    etapaTitulo: "Levantamento bibliografico",
    alunoId: 1,
    alunoNome: "Aluno E2E",
    orientadorId: 2,
    orientadorNome: "Prof Ana Orientadora",
    participacao: 4,
    qualidadeTecnica: 5,
    cumprimentoDePrazos: 4,
    comunicacao: 5,
    comentarioOrientador: "Excelente desempenho na etapa.",
    media: 4.5,
    cienciaRegistrada: false,
    comentarioAluno: "",
    dataCiencia: null,
    criadaEm: agora,
    atualizadaEm: agora,
  },
];

const perfil = {
  id: 2,
  nome: "Prof Ana Orientadora",
  email: "ana.orientadora@universidade.br",
  tipo: "ORIENTADOR",
  dataCadastro: "2025-01-01T00:00:00.000Z",
  instituicao: "Universidade E2E",
  bio: "Professora e pesquisadora.",
  fotoPerfilUrl: "",
  departamento: "Computacao",
  titulacao: "Doutora",
  projetos: 3,
  orientandos: 5,
  avaliacoes: 7,
};

async function fulfill(route: Route, status: number, body?: unknown): Promise<void> {
  await route.fulfill({
    status,
    headers: jsonHeaders,
    body: body === undefined ? "" : JSON.stringify(body),
  });
}

export async function setupAdvisorMock(page: Page): Promise<void> {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === "GET" && path === "/api/usuarios/me") {
      await fulfill(route, 200, advisorUser);
      return;
    }

    if (method === "GET" && path === "/api/notificacoes") {
      await fulfill(route, 200, []);
      return;
    }

    if (method === "GET" && path === "/api/orientador/dashboard") {
      await fulfill(route, 200, dashboard);
      return;
    }

    if (method === "GET" && path === "/api/orientador/inscricoes") {
      await fulfill(route, 200, inscricoes);
      return;
    }

    if (method === "GET" && path === "/api/orientador/orientandos") {
      await fulfill(route, 200, orientandos);
      return;
    }

    const orientandoDetailMatch = path.match(/^\/api\/orientador\/orientandos\/(\d+)$/);
    if (method === "GET" && orientandoDetailMatch) {
      await fulfill(route, 200, detalheOrientando);
      return;
    }

    if (method === "GET" && path === "/api/projetos/pagina") {
      await fulfill(route, 200, {
        content: projects,
        totalElements: projects.length,
        totalPages: 1,
        number: 0,
        size: 200,
      });
      return;
    }

    const etapasMatch = path.match(/^\/api\/projetos\/(\d+)\/etapas$/);
    if (method === "GET" && etapasMatch) {
      await fulfill(route, 200, etapas);
      return;
    }

    const entregasMatch = path.match(/^\/api\/projetos\/(\d+)\/entregas$/);
    if (method === "GET" && entregasMatch) {
      await fulfill(route, 200, entregas);
      return;
    }

    const versoesMatch = path.match(/^\/api\/projetos\/(\d+)\/entregas\/(\d+)\/versoes$/);
    if (method === "GET" && versoesMatch) {
      await fulfill(route, 200, versoes);
      return;
    }

    const avaliacoesMatch = path.match(/^\/api\/projetos\/(\d+)\/avaliacoes$/);
    if (method === "GET" && avaliacoesMatch) {
      await fulfill(route, 200, avaliacoes);
      return;
    }

    if (method === "GET" && path === "/api/orientador/perfil") {
      await fulfill(route, 200, perfil);
      return;
    }

    const projetoMatch = path.match(/^\/api\/projetos\/(\d+)$/);
    if (method === "GET" && projetoMatch) {
      const project = projects.find((p) => p.id === Number(projetoMatch[1]));
      await fulfill(route, project ? 200 : 404, project ?? { message: "Projeto nao encontrado." });
      return;
    }

    await fulfill(route, 404, { message: `Rota mock do orientador nao mapeada: ${method} ${path}` });
  });
}
