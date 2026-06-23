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
  const hasPeopleSource = Array.isArray(people);
  const used =
    hasPeopleSource
      ? getProjectSeatHolders(project, people).length
      : getExplicitSlotsUsed(project) ??
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

  const alunoCriadorId = project?.alunoCriadorId ?? alunoCriadorUsuario?.id ?? null;
  const alunoCriadorNome = project?.alunoCriadorNome ?? getUserName(alunoCriadorUsuario) ?? null;

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
        }
      : null,
    owner: (alunoCriadorId || alunoCriadorNome)
      ? {
          id: alunoCriadorId,
          name: alunoCriadorNome ?? "Aluno",
          email: "",
          type: "ALUNO",
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
