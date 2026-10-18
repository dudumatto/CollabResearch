import { conversationService } from "../services/conversationService";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Users, Clock, BookOpen, PaperPlaneTilt, Envelope, ChatCircleText, ChartBar, CheckCircle, Pencil, Trash, UserPlus, UserMinus, CircleNotch, Warning, User, XCircle, ArrowsLeftRight, SignOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useAuth } from "../hooks/useAuth";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { userService } from "../services/userService";
import { AppCombobox } from "../components/ui/AppCombobox";
import { StatusView } from "../components/StatusView";
import { Sk, SkLines } from "../components/Skeleton";
import {
  getProjectSeatHolders,
  getProjectSlotsUsage,
  getUserId,
  getUserName,
  getUserPhotoUrl,
  isProjectAdvisor,
  mapProject,
  mapProgressItem,
} from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import "./ProjectDetailPage.css";

// Mesma estrutura da página carregada: navegação, títulos de seção, rótulos e
// ícones aparecem na hora; só os dados do projeto mostram skeleton.
function ProjectDetailSkeleton({ onBack }) {
  return (
    <div className="pagina-detalhe-projeto" aria-busy="true" aria-label="Carregando projeto">
      <div className="pagina-detalhe-projeto__barra-topo">
        <button onClick={onBack} className="pagina-detalhe-projeto__voltar">
          <ArrowLeft size={16} />
          Voltar para projetos
        </button>
      </div>

      <div className="pagina-detalhe-projeto__grade">
        <div className="pagina-detalhe-projeto__conteudo-principal">
          <div className="detalhe-card">
            <div className="detalhe-card__topo">
              <div className="detalhe-card__badges">
                <Sk inline w={70} h={22} r="var(--raio-completo)" />
                <Sk inline w={90} h={22} r="var(--raio-completo)" />
              </div>
            </div>
            <Sk w="70%" h={22} style={{ marginBottom: 12 }} />
            <div className="detalhe-card__estatisticas">
              <div className="detalhe-card__stat-item"><ChartBar size={14} /><Sk inline w={90} h={12} /></div>
              <div className="detalhe-card__stat-item"><Clock size={14} /><Sk inline w={130} h={12} /></div>
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Sobre o projeto</h2>
            <Sk h={13} style={{ marginBottom: 6 }} />
            <Sk w="95%" h={13} style={{ marginBottom: 6 }} />
            <Sk w="80%" h={13} />
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Requisitos</h2>
            <div className="detalhe-card__lista-requisitos">
              {[1, 2].map((i) => <Sk key={i} w={i === 1 ? "60%" : "45%"} h={14} />)}
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Tecnologias e competências</h2>
            <div className="detalhe-card__chips">
              {[1, 2, 3].map((i) => <Sk key={i} inline w={70} h={24} r="var(--raio-completo)" />)}
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Histórico do projeto</h2>
            <Sk w="55%" h={13} style={{ marginBottom: 6 }} />
            <Sk w="40%" h={11} />
          </div>
        </div>

        <div className="pagina-detalhe-projeto__sidebar">
          <div className="card-inscricao">
            <div className="card-inscricao__grade-stats">
              {[
                { icon: Users, label: "Vagas disponiveis" },
                { icon: Clock, label: "Criado em" },
                { icon: BookOpen, label: "Área" },
              ].map((item) => (
                <div key={item.label} className="card-inscricao__stat">
                  <div className="card-inscricao__stat-linha">
                    <item.icon size={13} className="card-inscricao__stat-icone" />
                    <span className="card-inscricao__stat-label">{item.label}</span>
                  </div>
                  <Sk w="70%" h={16} />
                </div>
              ))}
            </div>
            <button className="card-inscricao__botao-perguntar" disabled>
              <ChatCircleText size={15} /> Perguntar ao orientador
            </button>
          </div>

          <div className="card-orientador">
            <h3 className="card-orientador__titulo">Orientador do projeto</h3>
            <div className="card-orientador__cabecalho">
              <Sk w={48} h={48} r="50%" />
              <div style={{ flex: 1 }}>
                <Sk w="65%" h={14} style={{ marginBottom: 6 }} />
                <Sk w="50%" h={12} />
              </div>
            </div>
            <div className="card-orientador__info-lista">
              <div className="card-orientador__info-linha">
                <span className="card-orientador__info-label">Email</span>
                <Sk inline w={140} h={12} />
              </div>
              <div className="card-orientador__info-linha">
                <span className="card-orientador__info-label">Atualizações</span>
                <Sk inline w={24} h={12} />
              </div>
            </div>
            <button className="card-orientador__botao-mensagem" disabled>
              <Envelope size={14} /> Enviar mensagem
            </button>
          </div>

          <div className="card-colaboradores">
            <h3 className="card-colaboradores__titulo">
              <Users size={15} /> Participantes
            </h3>
            <CollaboratorsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

function CollaboratorsSkeleton() {
  return (
    <SkLines rows={2} h={32} gap="var(--espaco-2)" label="Carregando participantes" />
  );
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  loadingLabel,
  loading,
  onCancel,
  onConfirm,
  titleId,
  descriptionId,
  returnFocusRef,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? [],
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialogRef.current?.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialogRef.current?.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel]);

  useEffect(() => () => {
    returnFocusRef?.current?.focus();
  }, [returnFocusRef]);

  return (
    <div
      className="modal-inscricao__sobreposicao"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && !loading && onCancel()}
    >
      <div
        ref={dialogRef}
        className="modal-inscricao__painel modal-confirmacao"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="modal-confirmacao__conteudo">
          <div className="modal-confirmacao__icone" aria-hidden="true">
            <Warning size={32} />
          </div>
          <h3 id={titleId} className="modal-inscricao__titulo">{title}</h3>
          <p id={descriptionId} className="modal-confirmacao__texto">{description}</p>
        </div>
        <div className="modal-inscricao__rodape">
          <button
            type="button"
            onClick={onCancel}
            className="modal-inscricao__botao-cancelar"
            disabled={loading}
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="modal-confirmacao__botao-confirmar"
          >
            {loading
              ? <><CircleNotch size={15} className="girando" /> {loadingLabel}</>
              : <><Trash size={15} /> {confirmLabel}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserPhotoAvatar({ className, name, src, fallbackClassName, fallback = "?" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showPhoto = Boolean(src) && !failed;
  const initials = String(name || fallback)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || fallback;

  return (
    <div className={className}>
      {showPhoto ? (
        <img src={src} alt={name ? `Foto de perfil de ${name}` : "Foto de perfil"} onError={() => setFailed(true)} />
      ) : fallbackClassName ? (
        <span className={fallbackClassName}>{initials}</span>
      ) : (
        initials
      )}
    </div>
  );
}
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [loadingApply, setLoadingApply] = useState(false);
  const [orientationActionLoading, setOrientationActionLoading] = useState(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Abandono de orientacao (orientador responsavel)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [abandonLoading, setAbandonLoading] = useState(false);
  const abandonTriggerRef = useRef(null);

  // Colaboradores
  const [collaborators, setCollaborators] = useState(null);
  const [collabLoading, setCollabLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState(null);
  const removeCollaboratorTriggerRef = useRef(null);
  const deleteProjectTriggerRef = useRef(null);

  // Troca de orientador: null | { advisors, selected, loading, saving }
  const [advisorModal, setAdvisorModal] = useState(null);
  const advisorTriggerRef = useRef(null);
  const advisorModalOpen = advisorModal != null;
  const advisorModalSaving = advisorModal?.saving === true;

  useEffect(() => {
    if (!advisorModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !advisorModalSaving) setAdvisorModal(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [advisorModalOpen, advisorModalSaving]);

  useEffect(() => {
    if (!advisorModalOpen) return undefined;
    return () => advisorTriggerRef.current?.focus();
  }, [advisorModalOpen]);

  // Recrutar
  const [inscricoes, setInscricoes] = useState([]);
  const [recrutandoId, setRecrutandoId] = useState(null);

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [project, progress, myApplications] = await Promise.all([
      projectService.getById(id),
      projectService.getProgress(id).catch(() => []),
      user?.tipo === "ALUNO" ? applicationService.listMine().catch(() => []) : Promise.resolve([]),
    ]);
    return {
      project: mapProject(project),
      progress: Array.isArray(progress) ? progress.map(mapProgressItem) : [],
      myApplications: Array.isArray(myApplications) ? myApplications : [],
    };
  }, [id, user?.tipo], { initialData: { project: null, progress: [], myApplications: [] } });

  const project = data?.project;

  const getCollaboratorId = (c) => {
    if (typeof c === "number" || typeof c === "string") return c;
    return (
      c?.usuarioId ??
      c?.userId ??
      c?.alunoUsuarioId ??
      c?.participanteUsuarioId ??
      c?.colaboradorUsuarioId ??
      getUserId(c)
    );
  };

  const slots = useMemo(
    () => (project ? getProjectSlotsUsage(project, Array.isArray(collaborators) ? collaborators : null) : { total: 0, used: 0, remaining: 0 }),
    [project, collaborators],
  );

  const isStudentCreator = useMemo(() => {
    if (!user?.id || !project) return false;
    return user?.tipo === "ALUNO" && project.ownerId != null && Number(user.id) === Number(project.ownerId);
  }, [user, project]);

  const isAdvisorOwner = useMemo(() => {
    if (!user?.id || !project) return false;
    return user?.tipo === "ORIENTADOR" && project.advisorId != null && Number(user.id) === Number(project.advisorId);
  }, [user, project]);

  const canAdvisorManageProject = isAdvisorOwner
    && project.status !== "PENDENTE_ORIENTADOR"
    && project.status !== "REJEITADO_ORIENTADOR";
  const canUpdateProject = (isStudentCreator || canAdvisorManageProject) && project.status !== "FINALIZADO";
  const canAbandonProject = isAdvisorOwner && (project.status === "ABERTO" || project.status === "EM_ANDAMENTO");
  const canApply = user?.tipo === "ALUNO" && !isStudentCreator;

  const currentApplication = useMemo(() => {
    if (!project || !Array.isArray(data?.myApplications)) return null;
    return data.myApplications.find((application) => {
      const applicationProjectId = application?.projeto?.id ?? application?.projetoId ?? application?.project?.id;
      return Number(applicationProjectId) === Number(project.id);
    }) ?? null;
  }, [data?.myApplications, project]);

  const canReviewGuidance = useMemo(() => {
    if (!user?.id || !project) return false;
    return project.status === "PENDENTE_ORIENTADOR"
      && project.advisorId != null
      && Number(user.id) === Number(project.advisorId);
  }, [user, project]);

  const canViewTeam = Boolean(project);
  const isApprovedProjectCollaborator = useMemo(() => {
    if (!user?.id || !Array.isArray(collaborators)) return false;
    return collaborators.some((collaborator) => Number(getCollaboratorId(collaborator)) === Number(user.id));
  }, [collaborators, user?.id]);

  const lacksAdvisor = project?.status === "SEM_ORIENTADOR";
  // Sem orientador: aluno criador escolhe; em projeto de orientador (sem criador) qualquer membro aprovado escolhe.
  const canChangeAdvisor = lacksAdvisor
    ? isStudentCreator || (user?.tipo === "ALUNO" && project.ownerId == null && isApprovedProjectCollaborator)
    : isStudentCreator && (project?.status === "PENDENTE_ORIENTADOR" || project?.status === "REJEITADO_ORIENTADOR");
  // Projeto que ja teve orientador nao pode ser excluido pelo aluno enquanto busca substituto.
  const canDeleteProject = canAdvisorManageProject || (canChangeAdvisor && !lacksAdvisor && !project.previousStatus);

  const canOpenGroupConversation = canAdvisorManageProject
    || isStudentCreator
    || (user?.tipo === "ALUNO" && currentApplication?.status === "APROVADO")
    || isApprovedProjectCollaborator;

  const displayParticipants = useMemo(() => {
    if (!project) return [];

    const people = [project.advisor, project.owner];
    const approved = Array.isArray(collaborators)
      ? getProjectSeatHolders(project, collaborators)
      : project.approvedParticipants;

    if (Array.isArray(approved)) people.push(...approved);

    const seen = new Set();
    return people.filter((person) => {
      if (!person) return false;
      const key = getUserId(person) ?? getUserName(person);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [collaborators, project]);

  const loadCollaborators = useCallback(async () => {
    setCollabLoading(true);
    try {
      const raw = await projectService.getCollaborators(id);
      setCollaborators(Array.isArray(raw) ? raw : null);
    } catch {
      setCollaborators(null);
    } finally {
      setCollabLoading(false);
    }
  }, [id]);

  const loadInscricoes = useCallback(async () => {
    try {
      const raw = await applicationService.listByProject(id);
      const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
      setInscricoes(list.filter((i) => i.status === "PENDENTE"));
    } catch {
      setInscricoes([]);
    }
  }, [id]);

  useEffect(() => {
    if (loading || !project) return;

    setCollaborators(null);
    if (canViewTeam) loadCollaborators();
    if (canAdvisorManageProject) loadInscricoes();
  }, [loading, project?.id, canViewTeam, canAdvisorManageProject, loadCollaborators, loadInscricoes]);


  const statusClass = project?.status === "FINALIZADO"
    ? "detalhe-card__badge-status--encerrado"
    : project?.status === "REJEITADO_ORIENTADOR"
      ? "detalhe-card__badge-status--encerrado"
      : project?.status === "PENDENTE_ORIENTADOR" || project?.status === "SEM_ORIENTADOR"
        ? "detalhe-card__badge-status--pendente"
    : project?.status === "EM_ANDAMENTO"
      ? "detalhe-card__badge-status--andamento"
      : "detalhe-card__badge-status--aberto";

  const openConversation = async (kind) => {
    if (kind === "private" && !project.advisor?.id) {
      toast.error("Este projeto não possui orientador vinculado. Aguarde a atribuição de um orientador para enviar mensagens.");
      return;
    }
    if (kind === "private" && Number(user?.id) === Number(project.advisor?.id)) {
      toast.error("Você é o orientador deste projeto e não pode enviar uma mensagem para si mesmo. Use a conversa do grupo.");
      return;
    }

    try {
      const conversa = kind === "group"
        ? await conversationService.abrirOuCriarPorProjeto(project.id)
        : await conversationService.openPrivate(project.advisor?.id);
      navigate("/app/chat", { state: { conversationId: conversa?.id } });
    } catch {
      toast.error(kind === "group" ? "Erro ao abrir conversa do grupo." : "Erro ao abrir conversa com o orientador.");
    }
  };

  const handleApply = async () => {
    setLoadingApply(true);
    try {
      await applicationService.create(id, motivation.trim());
      toast.success("Inscrição enviada com sucesso.");
      setShowModal(false);
      setMotivation("");
      await reload();
    } catch (err) {
      toast.error(err.message || "Não foi possível enviar a inscrição.");
    } finally {
      setLoadingApply(false);
    }
  };

  const closeApplyModal = () => {
    setShowModal(false);
    setMotivation("");
  };
  const openAdvisorModal = async () => {
    setAdvisorModal({ advisors: [], selected: "", loading: true, saving: false });
    try {
      const list = await userService.listAdvisors();
      const advisors = (Array.isArray(list) ? list : []).filter((a) => Number(a.id) !== Number(project.advisorId));
      // m == null: usuário fechou o modal enquanto carregava; não reabrir.
      setAdvisorModal((m) => m && { ...m, advisors, loading: false });
    } catch {
      setAdvisorModal(null);
      toast.error("Não foi possível carregar os orientadores.");
    }
  };

  const handleChangeAdvisor = async () => {
    setAdvisorModal((m) => m && { ...m, saving: true });
    try {
      await projectService.changeAdvisor(id, Number(advisorModal.selected));
    } catch (err) {
      setAdvisorModal((m) => m && { ...m, saving: false });
      toast.error(err.message || "Não foi possível trocar o orientador.");
      return;
    }
    toast.success("Solicitação enviada ao novo orientador.");
    setAdvisorModal(null);
    try {
      await reload();
    } catch {
      toast.error("Orientador trocado, mas não foi possível atualizar a página.");
    }
  };

  const handleAbandon = async () => {
    setAbandonLoading(true);
    try {
      await projectService.abandonGuidance(id);
      toast.success("Você deixou a orientação do projeto.");
      setShowAbandonConfirm(false);
      await reload();
    } catch (err) {
      toast.error(err.message || "Não foi possível abandonar a orientação.");
    } finally {
      setAbandonLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await projectService.remove(id);
      toast.success("Projeto excluido com sucesso.");
      navigate("/app/projects");
    } catch (err) {
      toast.error(err.message || "Não foi possível excluir o projeto.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    const usuarioId = getCollaboratorId(collaboratorToRemove);
    if (usuarioId == null) return;

    setRemovingId(usuarioId);
    try {
      await projectService.removerColaborador(id, usuarioId);
      toast.success("Colaborador removido.");
      setCollaboratorToRemove(null);
      await loadCollaborators();
    } catch (err) {
      toast.error(err.message || "Não foi possível remover o colaborador.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleGuidanceDecision = async (decision) => {
    setOrientationActionLoading(decision);
    try {
      if (decision === "accept") {
        await projectService.acceptGuidance(id);
      toast.success("Projeto aceito. Ele agora está aberto para inscrições.");
      } else {
        await projectService.rejectGuidance(id);
        toast.success("Projeto recusado.");
      }
      await reload();
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar a solicitação.");
    } finally {
      setOrientationActionLoading(null);
    }
  };

  const handleRecruter = async (inscricao) => {
    const uid = inscricao?.aluno?.usuario?.id ?? inscricao?.usuario?.id ?? inscricao?.id;
    if (!uid) return;
    setRecrutandoId(inscricao.id);
    try {
      await projectService.recrutar(id, uid);
      toast.success("Colaborador recrutado com sucesso.");
      await Promise.all([loadCollaborators(), loadInscricoes()]);
    } catch (err) {
      toast.error(err.message || "Não foi possível recrutar o colaborador.");
    } finally {
      setRecrutandoId(null);
    }
  };

  const getCollaboratorName = (c) => {
    const explicitName = [
      c?.nome,
      c?.name,
      c?.usuarioNome,
      c?.userName,
      c?.alunoNome,
      c?.participanteNome,
      c?.colaboradorNome,
      c?.usuario?.nome,
      c?.usuario?.name,
      c?.user?.nome,
      c?.user?.name,
      c?.aluno?.nome,
      c?.aluno?.name,
      c?.aluno?.usuario?.nome,
      c?.aluno?.usuario?.name,
      c?.participante?.nome,
      c?.participante?.name,
      c?.participante?.usuario?.nome,
      c?.participante?.usuario?.name,
      c?.colaborador?.nome,
      c?.colaborador?.name,
      c?.colaborador?.usuario?.nome,
      c?.colaborador?.usuario?.name,
    ].map((value) => String(value ?? "").trim()).find(Boolean);

    if (explicitName) return explicitName;

    const collaboratorId = getCollaboratorId(c);
    return collaboratorId != null ? `Usuário #${collaboratorId}` : "Participante";
  };

  const getCollaboratorPhotoUrl = (c) =>
    getUserPhotoUrl(c?.participante ?? c?.colaborador ?? c);

  const abrirPerfil = (usuarioId) => {
    if (usuarioId == null) return;
    navigate(`/app/users/${usuarioId}`);
  };

  const canRemoveCollaborator = (c) => {
    const collaboratorId = getCollaboratorId(c);
    return (
      canAdvisorManageProject &&
      collaboratorId != null &&
      !isProjectAdvisor(project, c) &&
      (project.ownerId == null || Number(collaboratorId) !== Number(project.ownerId))
    );
  };

  const getInscricaoName = (i) =>
    i?.alunoNome ?? i?.aluno?.usuario?.nome ?? i?.usuario?.nome ?? i?.nome ?? `Inscrição #${i?.id}`;

  const getInscricaoPhotoUrl = (i) =>
    i?.alunoFotoPerfilUrl || getUserPhotoUrl(i?.aluno?.usuario ?? i?.aluno ?? i?.usuario ?? i);

  const getInscricaoUserId = (i) =>
    i?.alunoUsuarioId ?? i?.userId ?? i?.usuario?.id ?? i?.aluno?.usuario?.id ?? getUserId(i?.aluno ?? i?.usuario);

  const applicationStatus = currentApplication?.status;
  const hasApplicationOrParticipation = Boolean(currentApplication) || isStudentCreator;

  if (loading) return <ProjectDetailSkeleton onBack={() => navigate(-1)} />;
  if (error || !project) {
    return <StatusView title="Projeto indisponível" description={error?.message || "Não foi possível localizar este projeto."} />;
  }

  return (
    <div className="pagina-detalhe-projeto">
      {/* Voltar + acoes de dono */}
      <div className="pagina-detalhe-projeto__barra-topo">
        <button onClick={() => navigate(-1)} className="pagina-detalhe-projeto__voltar">
          <ArrowLeft size={16} />
          Voltar para projetos
        </button>
        {(canUpdateProject || canDeleteProject || canChangeAdvisor || canAbandonProject) && (
          <div className="pagina-detalhe-projeto__acoes-dono">
            {canAbandonProject && (
              <button
                onClick={(event) => {
                  abandonTriggerRef.current = event.currentTarget;
                  setShowAbandonConfirm(true);
                }}
                className="pagina-detalhe-projeto__botao-excluir"
              >
                <SignOut size={15} /> Abandonar orientação
              </button>
            )}
            {canChangeAdvisor && (
              <button
                onClick={(event) => {
                  advisorTriggerRef.current = event.currentTarget;
                  openAdvisorModal();
                }}
                className="pagina-detalhe-projeto__botao-editar"
              >
                <ArrowsLeftRight size={15} /> {lacksAdvisor ? "Escolher novo orientador" : "Trocar orientador"}
              </button>
            )}
            {canUpdateProject && (
              <button
                onClick={() => navigate(`/app/projects/${id}/edit`)}
                className="pagina-detalhe-projeto__botao-editar"
              >
                <Pencil size={15} /> Editar
              </button>
            )}
            {canDeleteProject && (
              <button
                onClick={(event) => {
                  deleteProjectTriggerRef.current = event.currentTarget;
                  setShowDeleteConfirm(true);
                }}
                className="pagina-detalhe-projeto__botao-excluir"
              >
                <Trash size={15} /> Excluir
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pagina-detalhe-projeto__grade">
        {/* ── Conteúdo principal ── */}
        <div className="pagina-detalhe-projeto__conteudo-principal">
          <div className="detalhe-card">
            <div className="detalhe-card__topo">
              <div className="detalhe-card__badges">
                <span className={`detalhe-card__badge-status ${statusClass}`}>
                  {formatProjectStatus(project.status)}
                </span>
                <span className="detalhe-card__badge-area">{project.area}</span>
              </div>
            </div>

            <h1 className="detalhe-card__titulo-projeto">{project.title}</h1>

            {canReviewGuidance && (
              <div className="detalhe-card__orientacao-pendente">
                <p className="detalhe-card__orientacao-texto">
                  Este projeto aguarda seu aceite como orientador.
                </p>
                <div className="detalhe-card__orientacao-acoes">
                  <button
                    type="button"
                    onClick={() => handleGuidanceDecision("reject")}
                    className="detalhe-card__orientacao-botao detalhe-card__orientacao-botao--recusar"
                    disabled={orientationActionLoading != null}
                  >
                    {orientationActionLoading === "reject" ? <CircleNotch size={15} className="girando" /> : <><XCircle size={15} /> Recusar</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuidanceDecision("accept")}
                    className="detalhe-card__orientacao-botao detalhe-card__orientacao-botao--aceitar"
                    disabled={orientationActionLoading != null}
                  >
                    {orientationActionLoading === "accept" ? <CircleNotch size={15} className="girando" /> : <><CheckCircle size={15} /> Aceitar</>}
                  </button>
                </div>
              </div>
            )}

            <div className="detalhe-card__estatisticas">
              <div className="detalhe-card__stat-item"><ChartBar size={14} />{data.progress.length} atualizações</div>
              <div className="detalhe-card__stat-item">
                <Clock size={14} />
                Publicado em {project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "-"}
              </div>
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Sobre o projeto</h2>
            <p className="detalhe-card__descricao">{project.description}</p>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Requisitos</h2>
            <div className="detalhe-card__lista-requisitos">
              {project.requirements.length === 0 ? (
                <p className="detalhe-card__descricao">Nenhum requisito cadastrado.</p>
              ) : (
                project.requirements.map((req) => (
                  <div key={req} className="detalhe-card__requisito">
                    <div className="detalhe-card__requisito-icone">
                      <CheckCircle size={12} style={{ color: "var(--cor-primaria)" }} />
                    </div>
                    <span className="detalhe-card__requisito-texto">{req}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Tecnologias e competências</h2>
            <div className="detalhe-card__chips">
              {project.tags.length === 0 ? (
                <span className="detalhe-card__chip-tag">Não informado</span>
              ) : (
                project.tags.map((tag) => (
                  <span key={tag} className="detalhe-card__chip-tag">{tag}</span>
                ))
              )}
            </div>
          </div>

          <div className="detalhe-card">
            <h2 className="detalhe-card__titulo-secao">Histórico do projeto</h2>
            {data.progress.length === 0 ? (
              <p className="detalhe-card__descricao">Nenhuma atualização registrada.</p>
            ) : (
              <div className="detalhe-historico">
                {data.progress.map((item) => (
                  <div key={item.id} className="detalhe-historico__item">
                    <div className="detalhe-historico__marcador" />
                    <div className="detalhe-historico__conteudo">
                      <div className="detalhe-historico__cabecalho">
                        <h3 className="detalhe-historico__titulo">{item.title}</h3>
                        <span className="detalhe-historico__data">
                          {item.date ? new Date(item.date).toLocaleDateString("pt-BR") : "-"}
                        </span>
                      </div>
                      <p className="detalhe-historico__texto">{item.content}</p>
                      <span className="detalhe-historico__autor">{item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inscrições pendentes (apenas dono) */}
          {canAdvisorManageProject && (
            <div className="detalhe-card">
              <div className="detalhe-card__linha-inscricoes">
                <h2 className="detalhe-card__titulo-secao detalhe-card__titulo-secao--inline">Inscrições pendentes</h2>
                <button
                  type="button"
                  onClick={() => navigate(`/app/projects/${id}/applications`)}
                  className="detalhe-card__link-gerir-inscricoes"
                >
                  <Users size={15} /> Gerenciar inscrições
                </button>
              </div>
              {inscricoes.length === 0 ? (
                <p className="detalhe-card__descricao">Nenhuma inscrição pendente.</p>
              ) : (
                <div className="detalhe-colaboradores__lista">
                  {inscricoes.map((insc) => (
                    <div key={insc.id} className="detalhe-colaboradores__item">
                      <div className="detalhe-colaboradores__avatar">
                        {getInscricaoPhotoUrl(insc) ? (
                          <img src={getInscricaoPhotoUrl(insc)} alt={`Foto de perfil de ${getInscricaoName(insc)}`} />
                        ) : (
                          getInscricaoName(insc).charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="detalhe-colaboradores__nome">{getInscricaoName(insc)}</span>
                      <div className="detalhe-colaboradores__acoes">
                        {getInscricaoUserId(insc) != null && (
                          <button
                            type="button"
                            className="detalhe-colaboradores__botao-perfil"
                            onClick={() => navigate(`/app/users/${getInscricaoUserId(insc)}`)}
                          >
                            <User size={14} />
                            Ver perfil do aluno
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRecruter(insc)}
                          disabled={recrutandoId === insc.id}
                          className="detalhe-colaboradores__botao-recrutar"
                        >
                          {recrutandoId === insc.id
                            ? <CircleNotch size={14} className="girando" />
                            : <><UserPlus size={14} /> Recrutar</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="pagina-detalhe-projeto__sidebar">
          <div className="card-inscricao">
            <div className="card-inscricao__grade-stats">
              {[
                { icon: Users, label: "Vagas disponiveis", value: `${slots.remaining}/${slots.total}` },
                { icon: Clock, label: "Criado em", value: project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "-" },
                { icon: BookOpen, label: "Área", value: project.area },
              ].map((item) => (
                <div key={item.label} className="card-inscricao__stat">
                  <div className="card-inscricao__stat-linha">
                    <item.icon size={13} className="card-inscricao__stat-icone" />
                    <span className="card-inscricao__stat-label">{item.label}</span>
                  </div>
                  <p className="card-inscricao__stat-valor">{item.value}</p>
                </div>
              ))}
            </div>

            {hasApplicationOrParticipation && user?.tipo === "ALUNO" ? (
              <div className="card-inscricao__status-vinculo">
                {isStudentCreator
                  ? "Você criou este projeto."
                  : applicationStatus === "APROVADO"
                    ? "Você participa deste projeto."
                    : applicationStatus === "PENDENTE"
                      ? "Sua inscrição está em análise."
                      : "Você já se inscreveu neste projeto."}
              </div>
            ) : project.status === "ABERTO" && canApply && slots.remaining > 0 ? (
              <button onClick={() => setShowModal(true)} className="card-inscricao__botao-inscrever">
                <PaperPlaneTilt size={16} /> Inscrever-se
              </button>
            ) : (
              canApply && (
                <div className="card-inscricao__status-encerrado">
                  {slots.remaining <= 0 ? "Vagas preenchidas" : formatProjectStatus(project.status)}
                </div>
              )
            )}

            <button
              onClick={() => openConversation("private")}
              className="card-inscricao__botao-perguntar"
              disabled={!project.advisor?.id}
            >
              <ChatCircleText size={15} /> Perguntar ao orientador
            </button>
          </div>

          {/* Card orientador */}
          <div className="card-orientador">
            <h3 className="card-orientador__titulo">Orientador do projeto</h3>
            <div className="card-orientador__cabecalho">
              <UserPhotoAvatar
                className="card-orientador__avatar"
                name={project.advisor?.name}
                src={getUserPhotoUrl(project.advisor)}
                fallbackClassName="card-orientador__avatar-inicial"
                fallback="IC"
              />
              <div>
                {project.advisor?.id ? (
                  <button
                    type="button"
                    className="card-orientador__nome card-orientador__nome--clicavel"
                    onClick={() => abrirPerfil(project.advisor.id)}
                    title={`Ver perfil de ${project.advisor.name}`}
                  >
                    {project.advisor.name}
                  </button>
                ) : (
                  <p className="card-orientador__nome">{project.advisor?.name ?? "Sem orientador"}</p>
                )}
                <p className="card-orientador__departamento">{project.advisor?.specialty || project.area}</p>
              </div>
            </div>
            <div className="card-orientador__info-lista">
              <div className="card-orientador__info-linha">
                <span className="card-orientador__info-label">Email</span>
                <span className="card-orientador__info-valor">{project.advisor?.email ?? "-"}</span>
              </div>
              <div className="card-orientador__info-linha">
                <span className="card-orientador__info-label">Atualizações</span>
                <span className="card-orientador__info-valor">{data.progress.length}</span>
              </div>
            </div>
            <button
              onClick={() => openConversation("private")}
              className="card-orientador__botao-mensagem"
              disabled={!project.advisor?.id}
            >
              <Envelope size={14} /> Enviar mensagem
            </button>
          </div>

          {/* Card participantes */}
          <div className="card-colaboradores">
            <h3 className="card-colaboradores__titulo">
              <Users size={15} /> Participantes
            </h3>
            {collabLoading ? (
              <CollaboratorsSkeleton />
            ) : displayParticipants.length > 0 ? (
              <ul className="card-colaboradores__lista">
                {displayParticipants.map((c) => (
                  <li key={getCollaboratorId(c) ?? c} className="card-colaboradores__item">
                    <UserPhotoAvatar
                      className="card-colaboradores__avatar"
                      name={getCollaboratorName(c)}
                      src={getCollaboratorPhotoUrl(c)}
                      fallback={getCollaboratorName(c).charAt(0).toUpperCase() || "?"}
                    />
                    <span className="card-colaboradores__nome">
                      {getCollaboratorId(c) != null ? (
                        <button
                          type="button"
                          className="card-colaboradores__nome-link"
                          onClick={() => abrirPerfil(getCollaboratorId(c))}
                          title={`Ver perfil de ${getCollaboratorName(c)}`}
                        >
                          {getCollaboratorName(c)}
                        </button>
                      ) : (
                        getCollaboratorName(c)
                      )}
                      {isProjectAdvisor(project, c) && (
                        <span className="card-colaboradores__papel"> (Orientador)</span>
                      )}
                    </span>
                    {canRemoveCollaborator(c) && (
                      <button
                        type="button"
                        onClick={(event) => {
                          removeCollaboratorTriggerRef.current = event.currentTarget;
                          setCollaboratorToRemove(c);
                        }}
                        disabled={removingId === getCollaboratorId(c)}
                        className="card-colaboradores__botao-remover"
                        title="Remover colaborador"
                        aria-label={`Remover ${getCollaboratorName(c)}`}
                      >
                        {removingId === getCollaboratorId(c)
                          ? <CircleNotch size={12} className="girando" />
                          : <UserMinus size={13} />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : slots.used > 0 ? (
              <p className="card-colaboradores__vazio">
                {slots.used === 1 ? "1 participante aprovado." : `${slots.used} participantes aprovados.`}
              </p>
            ) : (
              <p className="card-colaboradores__vazio">Nenhum participante ainda.</p>
            )}

            {canOpenGroupConversation && (
              <button
                onClick={() => openConversation("group")}
                className="card-colaboradores__botao-grupo"
              >
                <ChatCircleText size={14} /> Mensagem do grupo
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Modal inscrição ── */}
      {showModal && createPortal(
        <div
          className="modal-inscricao__sobreposicao"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && !loadingApply && closeApplyModal()}
        >
          <div className="modal-inscricao__painel">
            <div className="modal-inscricao__cabecalho">
              <h3 className="modal-inscricao__titulo">Inscrição no projeto</h3>
              <p className="modal-inscricao__subtitulo">{project.title}</p>
            </div>
            <div className="modal-inscricao__corpo">
              <div>
                <label className="modal-inscricao__label">Carta de motivação</label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={5}
                  maxLength={1500}
                  className="modal-inscricao__textarea"
                  placeholder="Escreva sua motivação para o projeto..."
                />
                <p className="modal-inscricao__contador">{motivation.length}/1500 caracteres</p>
              </div>
            </div>
            <div className="modal-inscricao__rodape">
              <button type="button" onClick={closeApplyModal} className="modal-inscricao__botao-cancelar" disabled={loadingApply}>
                Cancelar
              </button>
              <button type="button" onClick={handleApply} disabled={loadingApply} className="modal-inscricao__botao-enviar">
                {loadingApply ? <div className="modal-inscricao__spinner" /> : <><PaperPlaneTilt size={15} /> Enviar inscrição</>}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
      {advisorModal && createPortal(
        <div
          className="modal-inscricao__sobreposicao"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && !advisorModal.saving && setAdvisorModal(null)}
        >
          <div className="modal-inscricao__painel" role="dialog" aria-modal="true" aria-labelledby="change-advisor-title">
            <div className="modal-inscricao__cabecalho">
              <h3 id="change-advisor-title" className="modal-inscricao__titulo">Trocar orientador</h3>
              <p className="modal-inscricao__subtitulo">{project.title}</p>
            </div>
            <div className="modal-inscricao__corpo">
              <AppCombobox
                id="novoOrientadorId"
                name="novoOrientadorId"
                ariaLabel="Selecionar novo orientador"
                value={advisorModal.selected}
                disabled={advisorModal.loading || advisorModal.saving}
                placeholder={advisorModal.loading ? "Carregando..." : "Selecione um orientador"}
                onChange={(selected) => setAdvisorModal((m) => ({ ...m, selected }))}
                options={[
                  { value: "", label: advisorModal.loading ? "Carregando..." : "Selecione um orientador", disabled: true },
                  ...advisorModal.advisors.map((a) => ({ value: a.id, label: a.nome })),
                ]}
              />
            </div>
            <div className="modal-inscricao__rodape">
              <button type="button" onClick={() => setAdvisorModal(null)} className="modal-inscricao__botao-cancelar" disabled={advisorModal.saving} autoFocus>
                Cancelar
              </button>
              <button type="button" onClick={handleChangeAdvisor} disabled={!advisorModal.selected || advisorModal.saving} className="modal-inscricao__botao-enviar">
                {advisorModal.saving ? <div className="modal-inscricao__spinner" /> : <><PaperPlaneTilt size={15} /> Solicitar</>}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
      {collaboratorToRemove && (
        <ConfirmationDialog
          title="Remover colaborador"
          description={<>Tem certeza que deseja remover <strong>{getCollaboratorName(collaboratorToRemove)}</strong> deste projeto?</>}
          confirmLabel="Remover"
          loadingLabel="Removendo..."
          loading={removingId != null}
          onCancel={() => setCollaboratorToRemove(null)}
          onConfirm={handleRemoveCollaborator}
          titleId="remove-collaborator-title"
          descriptionId="remove-collaborator-description"
          returnFocusRef={removeCollaboratorTriggerRef}
        />
      )}

      {showAbandonConfirm && (
        <ConfirmationDialog
          title="Abandonar orientação"
          description={<>Tem certeza que deseja deixar a orientação de <strong>{project.title}</strong>? Você perderá o acesso ao projeto e a equipe precisará escolher um novo orientador.</>}
          confirmLabel="Abandonar"
          loadingLabel="Abandonando..."
          loading={abandonLoading}
          onCancel={() => setShowAbandonConfirm(false)}
          onConfirm={handleAbandon}
          titleId="abandon-project-title"
          descriptionId="abandon-project-description"
          returnFocusRef={abandonTriggerRef}
        />
      )}

      {/* ── Modal confirmação exclusão ── */}
      {showDeleteConfirm && (
        <ConfirmationDialog
          title="Excluir projeto"
          description={<>Tem certeza que deseja excluir <strong>{project.title}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          loadingLabel="Excluindo..."
          loading={deleteLoading}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          titleId="delete-project-title"
          descriptionId="delete-project-description"
          returnFocusRef={deleteProjectTriggerRef}
        />
      )}
    </div>
  );
}
