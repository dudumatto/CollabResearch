import { formatNotificationType } from "./formatters";

export function getUserName(user) {
  const nestedUser = user?.usuario ?? user?.user ?? user?.aluno?.usuario ?? user?.aluno;
  return user?.nome ?? user?.name ?? nestedUser?.nome ?? nestedUser?.name ?? "Usuário";
}

export function getUserEmail(user) {
  const nestedUser = user?.usuario ?? user?.user ?? user?.aluno?.usuario ?? user?.aluno;
  return user?.email ?? nestedUser?.email ?? "";
}

export function getUserType(user) {
  const nestedUser = user?.usuario ?? user?.user ?? user?.aluno?.usuario ?? user?.aluno;
  return user?.tipo ?? user?.type ?? nestedUser?.tipo ?? nestedUser?.type ?? "";
}

function firstNonEmptyString(values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) ?? "";
}

export function getUserPhotoUrl(user) {
  const nestedUser = user?.usuario ?? user?.user ?? user?.aluno?.usuario ?? user?.aluno ?? user?.orientador?.usuario ?? user?.orientador;
  return firstNonEmptyString([
    user?.fotoPerfilUrl,
    user?.profilePhotoUrl,
    user?.imagemPerfilUrl,
    user?.fotoUrl,
    user?.avatarUrl,
    user?.photoUrl,
    user?.pictureUrl,
    nestedUser?.fotoPerfilUrl,
    nestedUser?.profilePhotoUrl,
    nestedUser?.imagemPerfilUrl,
    nestedUser?.fotoUrl,
    nestedUser?.avatarUrl,
    nestedUser?.photoUrl,
    nestedUser?.pictureUrl,
  ]);
}

export function withImageCacheBuster(url, version = Date.now()) {
  const raw = String(url ?? "").trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(raw, base);
    parsed.searchParams.set("v", String(version));
    if (raw.startsWith("/")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    const separator = raw.includes("?") ? "&" : "?";
    return `${raw}${separator}v=${encodeURIComponent(String(version))}`;
  }
}

export function getUserId(user) {
  const nestedUser = user?.usuario ?? user?.user ?? user?.aluno?.usuario ?? user?.aluno;
  return user?.usuarioId ?? user?.userId ?? nestedUser?.id ?? user?.id ?? null;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getProjectParticipants(project) {
  if (Array.isArray(project?.participantes_aprovados)) return project.participantes_aprovados;
  if (Array.isArray(project?.participantesAprovados)) return project.participantesAprovados;
  if (Array.isArray(project?.participantes)) return project.participantes;
  if (Array.isArray(project?.colaboradores)) return project.colaboradores;
  return [];
}

function getProjectCollaborators(project) {
  if (Array.isArray(project?.colaboradores)) return project.colaboradores;
  if (Array.isArray(project?.participantes_aprovados)) return project.participantes_aprovados;
  if (Array.isArray(project?.participantesAprovados)) return project.participantesAprovados;
  return [];
}

function hasExplicitParticipants(project) {
  return (
    Array.isArray(project?.participantes_aprovados) ||
    Array.isArray(project?.participantesAprovados) ||
    Array.isArray(project?.participantes) ||
    Array.isArray(project?.colaboradores)
  );
}

function getProjectSlotsTotal(project) {
  return (
    toNumber(project?.slots) ??
    toNumber(project?.limite_vagas) ??
    toNumber(project?.limiteVagas) ??
    toNumber(project?.limite_participantes) ??
    toNumber(project?.limiteParticipantes) ??
    toNumber(project?.vagas) ??
    toNumber(project?.quantidadeVagas) ??
    toNumber(project?.qtdVagas) ??
    0
  );
}

function getExplicitSlotsUsed(project) {
  return (
    toNumber(project?.slotsUsed) ??
    toNumber(project?.vagasOcupadas) ??
    toNumber(project?.vagasPreenchidas) ??
    toNumber(project?.quantidadeVagasOcupadas) ??
    toNumber(project?.quantidadeVagasPreenchidas)
  );
}

function hasAcceptedStatus(person) {
  const status = String(person?.status ?? person?.statusInscricao ?? person?.situacao ?? "").toUpperCase();
  return !status || status === "ACEITO" || status === "APROVADO" || status === "APPROVED";
}

export function isProjectAdvisor(project, person) {
  const personId = getUserId(person);
  const advisorId =
    project?.advisorId ??
    project?.orientadorId ??
    project?.advisor?.id ??
    project?.orientador?.usuario?.id ??
    project?.orientador?.id ??
    null;

  return (
    getUserType(person).toUpperCase() === "ORIENTADOR" ||
    (advisorId != null && personId != null && Number(personId) === Number(advisorId))
  );
}

export function getProjectSeatHolders(project, people = null) {
  const source = Array.isArray(people)
    ? people
    : getProjectParticipants(project);
  const seen = new Set();

  return source.filter((person) => {
    if (!person || isProjectAdvisor(project, person) || !hasAcceptedStatus(person)) {
      return false;
    }

    const identifier = getUserId(person) ?? getUserEmail(person);
    const key = identifier || getUserName(person);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getProjectSlotsUsage(project, people = null) {
  const total = Math.max(getProjectSlotsTotal(project), 0);
  const explicitUsed = getExplicitSlotsUsed(project);
  const hasPeopleSource = Array.isArray(people);
  const peopleUsed = hasPeopleSource
    ? getProjectSeatHolders(project, people).length
    : null;
  const used = hasPeopleSource
    ? Math.max(peopleUsed, explicitUsed ?? 0)
    : explicitUsed ??
      (hasExplicitParticipants(project) ? getProjectSeatHolders(project).length : 0);

  return {
    total,
    used: Math.max(used, 0),
    remaining: Math.max(total - used, 0),
  };
}

export function mapProject(project) {
  // ProjetoResponse retorna campos planos (orientadorId, alunoCriadorId)
  // mas também pode vir com objetos aninhados (legado) - suporta os dois formatos
  const orientadorUsuario = project?.orientador?.usuario ?? null;
  const alunoCriadorUsuario = project?.alunoCriador?.usuario ?? null;

  const orientadorId = project?.orientadorId ?? orientadorUsuario?.id ?? null;
  const orientadorNome = project?.orientadorNome ?? getUserName(orientadorUsuario) ?? null;
  const orientadorEmail = project?.orientadorEmail ?? getUserEmail(orientadorUsuario) ?? null;
  const orientadorFotoPerfilUrl =
    project?.orientadorFotoPerfilUrl ||
    project?.orientadorFotoUrl ||
    getUserPhotoUrl(project?.orientador) ||
    getUserPhotoUrl(orientadorUsuario);

  const alunoCriadorId = project?.alunoCriadorId ?? alunoCriadorUsuario?.id ?? null;
  const alunoCriadorNome = project?.alunoCriadorNome ?? getUserName(alunoCriadorUsuario) ?? null;
  const alunoCriadorFotoPerfilUrl =
    project?.alunoCriadorFotoPerfilUrl ||
    project?.alunoCriadorFotoUrl ||
    getUserPhotoUrl(project?.alunoCriador) ||
    getUserPhotoUrl(alunoCriadorUsuario);

  const colaboradores = getProjectCollaborators(project);
  const colaboradoresAceitos = getProjectSeatHolders({ ...project, advisorId: orientadorId }, colaboradores);
  const vagas = getProjectSlotsUsage({ ...project, advisorId: orientadorId });
  const tecnologias = project?.tecnologias ?? project?.technologies ?? project?.competencias ?? project?.tags;

  return {
    id: project?.id,
    title: project?.titulo ?? project?.title ?? "Projeto sem título",
    description: project?.descricao ?? project?.description ?? "",
    requisitos: project?.requisitos ?? "",
    requirements: (() => {
      const r = project?.requisitos ?? project?.requirements;
      if (!r) return [];
      if (Array.isArray(r)) return r;
      return r.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    })(),
    technologies: tecnologias ?? "",
    fotoProjetoUrl: project?.fotoProjetoUrl ?? project?.projectPhotoUrl ?? project?.imagemUrl ?? project?.imageUrl ?? "",
    coverUrl: project?.fotoProjetoUrl ?? project?.projectPhotoUrl ?? project?.imagemUrl ?? project?.imageUrl ?? "",
    tags: (() => {
      if (!tecnologias) return [];
      if (Array.isArray(tecnologias)) return tecnologias;
      return String(tecnologias).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    })(),
    courses: project?.cursosAceitos ?? (project?.cursoNome ? [project.cursoNome] : []),
    area: project?.areaNome ?? project?.area ?? project?.orientador?.areaAtuacao ?? "Pesquisa",
    areaId: project?.areaId ?? null,
    status: project?.status ?? "ABERTO",
    createdAt: project?.dataCriacao ?? project?.createdAt ?? null,
    dataInicio: project?.dataInicio ?? null,
    dataFim: project?.dataFim ?? null,
    dataLimiteInscricao: project?.dataLimiteInscricao ?? null,
    slots: vagas.total,
    slotsUsed: vagas.used,
    slotsRemaining: vagas.remaining,
    participants: getProjectSeatHolders({ ...project, advisorId: orientadorId }),
    approvedParticipants: getProjectSeatHolders({ ...project, advisorId: orientadorId }),
    collaborators: colaboradores,
    acceptedCollaborators: colaboradoresAceitos,
    ownerId: alunoCriadorId,
    advisorId: orientadorId,
    advisor: (orientadorId || orientadorNome)
      ? {
          id: orientadorId,
          name: orientadorNome ?? "Orientador",
          email: orientadorEmail ?? "",
          type: "ORIENTADOR",
          specialty: project?.orientador?.areaAtuacao ?? project?.areaNome ?? "",
          fotoPerfilUrl: orientadorFotoPerfilUrl ?? "",
          avatarUrl: orientadorFotoPerfilUrl ?? "",
        }
      : null,
    owner: (alunoCriadorId || alunoCriadorNome)
      ? {
          id: alunoCriadorId,
          name: alunoCriadorNome ?? "Aluno",
          email: "",
          type: "ALUNO",
          fotoPerfilUrl: alunoCriadorFotoPerfilUrl ?? "",
          avatarUrl: alunoCriadorFotoPerfilUrl ?? "",
        }
      : null,
  };
}

export function mapApplication(application) {
  return {
    id: application?.id,
    status: application?.status ?? "PENDENTE",
    appliedAt: application?.dataInscricao ?? application?.appliedAt ?? null,
    updatedAt: application?.dataAtualizacao ?? application?.updatedAt ?? null,
    project: application?.projeto ? mapProject(application.projeto) : null,
    user: application?.aluno?.usuario ?? application?.usuario ?? null,
    userId:
      application?.alunoUsuarioId ??
      application?.aluno?.usuario?.id ??
      application?.usuario?.id ??
      null,
  };
}

export function mapAdvisorApplication(application) {
  const project = application?.projeto ? mapProject(application.projeto) : null;

  return {
    id: application?.id,
    status: application?.status ?? "PENDENTE",
    motivacao: application?.motivacao ?? "",
    parecerOrientador: application?.parecerOrientador ?? "",
    appliedAt: application?.dataInscricao ?? null,
    updatedAt: application?.dataAtualizacao ?? null,
    projetoId: application?.projetoId ?? project?.id ?? null,
    projetoTitulo: application?.projetoTitulo ?? project?.title ?? "Projeto",
    alunoId: application?.alunoId ?? null,
    alunoUsuarioId: application?.alunoUsuarioId ?? null,
    alunoNome: application?.alunoNome ?? project?.owner?.name ?? "Estudante",
    project,
  };
}

function normalizeActionUrl(actionUrl) {
  if (!actionUrl) return "/app/notifications";

  const legacyProjectApplicationsMatch = String(actionUrl).match(/^\/projetos\/([^/]+)\/inscricoes$/);
  if (legacyProjectApplicationsMatch) {
    return `/app/projects/${legacyProjectApplicationsMatch[1]}/applications`;
  }

  const legacyProjectMatch = String(actionUrl).match(/^\/projetos\/([^/]+)$/);
  if (legacyProjectMatch) {
    return `/app/projects/${legacyProjectMatch[1]}`;
  }

  if (String(actionUrl).startsWith("/projetos?")) {
    return String(actionUrl).replace("/projetos?", "/app/projects?");
  }

  if (actionUrl === "/usuarios/me/inscricoes") {
    return "/app/applications";
  }

  const legacyRoutes = {
    "/inscricoes": "/app/projects",
    "/minhas-inscricoes": "/app/applications",
    "/meus-projetos": "/app/projects",
    "/conversas": "/app/chat",
    "/projetos": "/app/projects",
  };

  if (legacyRoutes[actionUrl]) {
    return legacyRoutes[actionUrl];
  }

  return actionUrl;
}

export function mapNotification(notification) {
  const metadata = notification?.metadata ?? notification?.meta ?? notification?.dados ?? notification?.data ?? {};
  const relatedEntity = notification?.entidadeRelacionada ?? notification?.relatedEntity ?? null;
  const relatedEntityId = notification?.entidadeId ?? notification?.relatedEntityId ?? null;
  const isConversationNotification = String(relatedEntity ?? "").toUpperCase() === "CONVERSA";
  const actionUrl =
    notification?.link ??
    notification?.rotaSugerida ??
    notification?.actionUrl ??
    "/app/notifications";

  return {
    id: notification?.id,
    title:
      notification?.titulo ??
      formatNotificationType(notification?.tipo) ??
      "Notificação",
    message: notification?.mensagem ?? notification?.message ?? "",
    type: notification?.tipo ?? "INFO",
    read: notification?.lida ?? notification?.read ?? false,
    createdAt: notification?.dataCriacao ?? notification?.createdAt ?? null,
    actionUrl: normalizeActionUrl(actionUrl),
    relatedEntity,
    relatedEntityId,
    conversationId:
      notification?.conversaId ??
      notification?.conversationId ??
      notification?.conversa_id ??
      metadata?.conversaId ??
      metadata?.conversationId ??
      metadata?.conversa_id ??
      (isConversationNotification ? relatedEntityId : null) ??
      null,
    messageId:
      notification?.mensagemId ??
      notification?.messageId ??
      notification?.mensagem_id ??
      metadata?.mensagemId ??
      metadata?.messageId ??
      metadata?.mensagem_id ??
      null,
    metadata,
    user: notification?.usuario ?? null,
  };
}

export function mapFeedback(feedback) {
  const avaliador = feedback?.avaliadorNome
    ? {
        id: feedback?.avaliadorId ?? null,
        nome: feedback.avaliadorNome,
        name: feedback.avaliadorNome,
        tipo: feedback?.avaliadorTipo ?? "",
      }
    : feedback?.aluno?.usuario ?? feedback?.usuario ?? null;

  return {
    id: feedback?.id,
    rating: feedback?.nota ?? feedback?.rating ?? 0,
    comment: feedback?.comentario ?? feedback?.comment ?? "",
    date: feedback?.dataFeedback ?? feedback?.dataCriacao ?? feedback?.date ?? null,
    project: feedback?.projeto ? mapProject(feedback.projeto) : null,
    from: avaliador,
  };
}

export function mapProgressItem(progress) {
  return {
    id: progress?.id,
    title: progress?.descricao ?? progress?.titulo ?? "Atualização",
    content: progress?.descricao ?? progress?.content ?? "",
    date: progress?.dataRegistro ?? progress?.date ?? null,
    author: getUserName(progress?.usuario ?? progress?.autor ?? {}),
    type: "update",
  };
}

export function mapDocument(document) {
  return {
    id: document?.id,
    name: document?.nomeArquivo ?? document?.name ?? "Documento",
    type: document?.tipo ?? "CURRICULO",
    uploadedAt: document?.dataEnvio ?? document?.dataUpload ?? document?.uploadedAt ?? null,
    status: document?.status ?? "ENVIADO",
    previewUrl: document?.previewUrl ?? null,
    downloadUrl: document?.downloadUrl ?? null,
  };
}

function queueItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: item?.id ?? null,
      titulo: item?.titulo ?? "",
      subtitulo: item?.subtitulo ?? "",
      destino: item?.destino ?? "",
      status: item?.status ?? "",
    }))
    .filter((item) => item.id != null);
}

export function mapOrientadorDashboard(dashboard) {
  const metricas = dashboard?.metricas ?? {};
  const filas = dashboard?.filas ?? {};

  return {
    metricas: {
      projetosAtivos: Number(metricas.projetosAtivos ?? 0),
      solicitacoesOrientacao: Number(metricas.solicitacoesOrientacao ?? 0),
      inscricoesPendentes: Number(metricas.inscricoesPendentes ?? 0),
      orientandosAtivos: Number(metricas.orientandosAtivos ?? 0),
      etapasAtrasadas: Number(metricas.etapasAtrasadas ?? 0),
      entregasAguardandoRevisao: Number(metricas.entregasAguardandoRevisao ?? 0),
      avaliacoesAguardandoCiencia: Number(metricas.avaliacoesAguardandoCiencia ?? 0),
    },
    filas: {
      projetosAtivos: queueItems(filas.projetosAtivos),
      solicitacoesOrientacao: queueItems(filas.solicitacoesOrientacao),
      inscricoesPendentes: queueItems(filas.inscricoesPendentes),
      orientandosAtivos: queueItems(filas.orientandosAtivos),
      etapasAtrasadas: queueItems(filas.etapasAtrasadas),
      entregasAguardandoRevisao: queueItems(filas.entregasAguardandoRevisao),
      avaliacoesAguardandoCiencia: queueItems(filas.avaliacoesAguardandoCiencia),
    },
  };
}

export function mapOrientando(orientando) {
  if (!orientando) return null;

  const projetos = Array.isArray(orientando.projetos)
    ? orientando.projetos.map((p) => ({
        projetoId: p?.projetoId ?? null,
        projetoTitulo: p?.projetoTitulo ?? "Projeto",
        status: p?.status ?? "",
      }))
    : [];

  return {
    alunoId: orientando.alunoId ?? null,
    alunoUsuarioId: orientando.alunoUsuarioId ?? null,
    nome: orientando.nome ?? "Estudante",
    email: orientando.email ?? "",
    ra: orientando.ra ?? "",
    curso: orientando.curso ?? "",
    situacao: orientando.situacao ?? "INATIVO",
    progresso: Number(orientando.progresso ?? 0),
    pendencias: Number(orientando.pendencias ?? 0),
    projetos,
  };
}

export function mapOrientandoDetalhe(detalhe) {
  if (!detalhe) return null;

  const projetos = Array.isArray(detalhe.projetos)
    ? detalhe.projetos.map((p) => ({
        projetoId: p?.projetoId ?? null,
        projetoTitulo: p?.projetoTitulo ?? "Projeto",
        status: p?.status ?? "",
      }))
    : [];

  const etapas = Array.isArray(detalhe.etapas)
    ? detalhe.etapas.map((e) => ({
        id: e?.id ?? null,
        titulo: e?.titulo ?? "Etapa",
        descricao: e?.descricao ?? "",
        ordem: e?.ordem ?? 0,
        peso: e?.peso ?? 0,
        obrigatoria: Boolean(e?.obrigatoria),
        status: e?.status ?? "PENDING",
        responsavel: e?.responsavel ?? "AMBOS",
        prazo: e?.prazo ?? null,
        concluidaEm: e?.concluidaEm ?? null,
        concluidaPorNome: e?.concluidaPorNome ?? "",
      }))
    : [];

  const historico = Array.isArray(detalhe.historico)
    ? detalhe.historico.map((h) => ({
        id: h?.id ?? null,
        titulo: h?.titulo ?? "Atualização",
        descricao: h?.descricao ?? "",
        categoria: h?.categoria ?? "ATUALIZACAO",
        dataRegistro: h?.dataRegistro ?? null,
      }))
    : [];

  const selecionado = detalhe.projetoSelecionado ?? null;

  return {
    alunoId: detalhe.alunoId ?? null,
    alunoUsuarioId: detalhe.alunoUsuarioId ?? null,
    nome: detalhe.nome ?? "Estudante",
    email: detalhe.email ?? "",
    ra: detalhe.ra ?? "",
    curso: detalhe.curso ?? "",
    semestre: detalhe.semestre ?? null,
    interesses: detalhe.interesses ?? "",
    projetoSelecionado: selecionado
      ? {
          projetoId: selecionado.projetoId ?? null,
          projetoTitulo: selecionado.projetoTitulo ?? "Projeto",
          status: selecionado.status ?? "",
        }
      : null,
    projetos,
    progresso: Number(detalhe.progresso ?? 0),
    etapas,
    historico,
  };
}

export function mapOrientadorPerfil(perfil) {
  if (!perfil) return null;

  return {
    id: perfil?.id ?? null,
    nome: perfil?.nome ?? "",
    email: perfil?.email ?? "",
    tipo: perfil?.tipo ?? "ORIENTADOR",
    dataCadastro: perfil?.dataCadastro ?? null,
    instituicao: perfil?.instituicao ?? "",
    bio: perfil?.bio ?? "",
    fotoPerfilUrl: perfil?.fotoPerfilUrl ?? "",
    departamento: perfil?.departamento ?? "",
    titulacao: perfil?.titulacao ?? "",
    projetos: Number(perfil?.projetos ?? 0),
    orientandos: Number(perfil?.orientandos ?? 0),
    avaliacoes: Number(perfil?.avaliacoes ?? 0),
  };
}

export function mapEtapa(etapa) {
  if (!etapa) return null;

  return {
    id: etapa?.id ?? null,
    projetoId: etapa?.projetoId ?? null,
    titulo: etapa?.titulo ?? "Etapa",
    descricao: etapa?.descricao ?? "",
    peso: Number(etapa?.peso ?? 0),
    ordem: Number(etapa?.ordem ?? 0),
    status: etapa?.status ?? "PENDING",
    responsavel: etapa?.responsavel ?? "AMBOS",
    prazo: etapa?.prazo ?? null,
    obrigatoria: Boolean(etapa?.obrigatoria),
    criadaEm: etapa?.criadaEm ?? etapa?.createdAt ?? null,
    concluidaEm: etapa?.concluidaEm ?? null,
    concluidaPorId: etapa?.concluidaPorId ?? null,
    concluidaPorNome: etapa?.concluidaPorNome ?? "",
  };
}

export function mapEntrega(entrega) {
  if (!entrega) return null;

  return {
    id: entrega?.id ?? null,
    projetoId: entrega?.projetoId ?? null,
    etapaId: entrega?.etapaId ?? null,
    etapaTitulo: entrega?.etapaTitulo ?? "",
    autorId: entrega?.autorId ?? null,
    autorNome: entrega?.autorNome ?? "",
    titulo: entrega?.titulo ?? "Entrega",
    categoria: entrega?.categoria ?? "",
    status: entrega?.status ?? "PENDING_REVIEW",
    criadaEm: entrega?.criadaEm ?? null,
    atualizadaEm: entrega?.atualizadaEm ?? null,
    ultimaVersaoId: entrega?.ultimaVersaoId ?? null,
    totalVersoes: Number(entrega?.totalVersoes ?? 0),
  };
}

export function mapDeliveryVersion(versao) {
  if (!versao) return null;

  return {
    id: versao?.id ?? null,
    numeroVersao: Number(versao?.numeroVersao ?? 1),
    nomeArquivo: versao?.nomeArquivo ?? "Arquivo",
    contentType: versao?.contentType ?? "",
    tamanhoBytes: Number(versao?.tamanhoBytes ?? 0),
    enviadaEm: versao?.enviadaEm ?? null,
    revisao: versao?.revisao
      ? {
          id: versao.revisao.id ?? null,
          versaoId: versao.revisao.versaoId ?? null,
          revisorId: versao.revisao.revisorId ?? null,
          revisorNome: versao.revisao.revisorNome ?? "",
          decisao: versao.revisao.decisao ?? "",
          comentario: versao.revisao.comentario ?? "",
          revisadaEm: versao.revisao.revisadaEm ?? null,
        }
      : null,
  };
}

export function mapAvaliacaoAcademica(avaliacao) {
  if (!avaliacao) return null;

  return {
    id: avaliacao?.id ?? null,
    projetoId: avaliacao?.projetoId ?? null,
    etapaId: avaliacao?.etapaId ?? null,
    etapaTitulo: avaliacao?.etapaTitulo ?? "",
    alunoId: avaliacao?.alunoId ?? null,
    alunoNome: avaliacao?.alunoNome ?? "",
    orientadorId: avaliacao?.orientadorId ?? null,
    orientadorNome: avaliacao?.orientadorNome ?? "",
    participacao: Number(avaliacao?.participacao ?? 0),
    qualidadeTecnica: Number(avaliacao?.qualidadeTecnica ?? 0),
    cumprimentoDePrazos: Number(avaliacao?.cumprimentoDePrazos ?? 0),
    comunicacao: Number(avaliacao?.comunicacao ?? 0),
    comentarioOrientador: avaliacao?.comentarioOrientador ?? "",
    media: avaliacao?.media ?? null,
    cienciaRegistrada: Boolean(avaliacao?.cienciaRegistrada),
    comentarioAluno: avaliacao?.comentarioAluno ?? "",
    dataCiencia: avaliacao?.dataCiencia ?? null,
    criadaEm: avaliacao?.criadaEm ?? null,
    atualizadaEm: avaliacao?.atualizadaEm ?? null,
  };
}
