import { useEffect, useMemo, useState } from "react";
import { CalendarBlank, CheckSquare, ClipboardText, Flag, Hourglass, Plus, Users, WarningCircle } from "@phosphor-icons/react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useProjectProgress } from "../hooks/useProjectProgress";
import { userService } from "../services/userService";
import { progressService } from "../services/progressService";
import { mapProject } from "../utils/adapters";
import { formatDate, formatProjectStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { AppCombobox } from "../components/ui/AppCombobox";
import { ProgressDonut } from "../components/progress/ProgressDonut";
import { MarcoLista } from "../components/progress/MarcoLista";
import { FiltrosMarco } from "../components/progress/MarcoPartes";
import { marcosApi } from "../components/progress/marcosApi";
import { useMarcos } from "../components/progress/useMarcos";
import { contarFiltros, filtrarMarcos, mensagemDeErro } from "../components/progress/marcoUtils";
import { UpdateForm } from "../components/progress/UpdateForm";
import { UpdateFormModal } from "../components/progress/UpdateFormModal";
import { UpdateFeed } from "../components/progress/UpdateFeed";
import "./ProgressPage.css";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", style }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function projectStatusClass(status) {
  if (status === "FINALIZADO") return "progress-page__status-chip--finalizado";
  if (status === "EM_ANDAMENTO") return "progress-page__status-chip--andamento";
  if (status === "ABERTO") return "progress-page__status-chip--aberto";
  return "";
}

function getStepDeadline(step) {
  const value = step?.deadline ?? step?.prazo ?? step?.dataPrazo ?? null;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function sortStepsByNearestDeadline(steps = []) {
  return [...steps].sort((first, second) => {
    const firstDeadline = getStepDeadline(first);
    const secondDeadline = getStepDeadline(second);
    if (firstDeadline !== null && secondDeadline !== null) return firstDeadline - secondDeadline;
    if (firstDeadline !== null) return -1;
    if (secondDeadline !== null) return 1;
    return Number(first.stepOrder ?? 0) - Number(second.stepOrder ?? 0);
  });
}

function UpdatesPanelSkeleton() {
  return (
    <>
      <div className="progress-page__collapsed-form progress-page__collapsed-form--skeleton" aria-hidden="true">
        <Sk w="58%" h={15} style={{ maxWidth: 320 }} />
        <Sk w="82%" h={13} style={{ maxWidth: 520, marginTop: 12 }} />
      </div>

      <div className="progress-page__updates" aria-busy="true" aria-label="Carregando atualizações">
        <h3>Atualizações recentes</h3>
        <div className="update-feed update-feed--skeleton">
          {[0, 1, 2].map((item) => (
            <article key={item} className="update-feed__item update-feed__item--skeleton">
              <div className="update-feed__header">
                <div className="update-feed__author">
                  <Sk w={36} h={36} r="50%" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Sk w="46%" h={14} style={{ maxWidth: 170 }} />
                    <Sk w="32%" h={11} style={{ maxWidth: 120, marginTop: 8 }} />
                  </div>
                </div>
                <Sk w={92} h={26} r={999} />
              </div>
              <Sk w="68%" h={18} style={{ maxWidth: 360, marginTop: 18 }} />
              <Sk w="100%" h={12} style={{ maxWidth: 560, marginTop: 12 }} />
              <Sk w="76%" h={12} style={{ maxWidth: 430, marginTop: 8 }} />
              <div className="update-feed__meta">
                <Sk w={130} h={13} />
                <Sk w={116} h={13} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
function ProgressSkeleton() {
  return (
    <div className="progress-page">
      <header className="progress-page__hero">
        <div className="progress-page__hero-copy">
          <Sk w={190} h={28} r={999} style={{ maxWidth: "55%" }} />
          <Sk w={340} h={38} r={12} style={{ maxWidth: "80%", marginTop: 14 }} />
          <Sk w="100%" h={14} r={999} style={{ maxWidth: 620, marginTop: 16 }} />
          <Sk w="72%" h={14} r={999} style={{ maxWidth: 460, marginTop: 8 }} />
        </div>
        <div className="progress-page__project-picker">
          <Sk w={72} h={13} />
          <Sk w="100%" h={48} r={16} />
        </div>
      </header>

      <section className="progress-page__overview">
        <div className="progress-page__panel progress-page__panel--summary">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Sk w={180} h={180} r="50%" style={{ marginBottom: 18 }} />
            <Sk w="58%" h={16} style={{ maxWidth: 150, marginBottom: 10 }} />
            <Sk w="42%" h={12} style={{ maxWidth: 120 }} />
          </div>
        </div>

        <div className="progress-page__panel progress-page__panel--stats">
          <div className="progress-page__panel-title-row">
            <div style={{ flex: 1 }}>
              <Sk w="45%" h={22} style={{ maxWidth: 260 }} />
              <Sk w="34%" h={13} style={{ maxWidth: 190, marginTop: 10 }} />
            </div>
            <Sk w={92} h={30} r={999} />
          </div>

          <div className="progress-page__stats-grid progress-page__stats-grid--tres">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="progress-stat">
                <Sk w={18} h={18} r={999} />
                <Sk w="70%" h={14} />
                <Sk w="45%" h={18} />
              </div>
            ))}
          </div>

          <div className="progress-page__summary-line">
            <Sk w={120} h={14} />
            <Sk w={150} h={15} />
          </div>
        </div>
      </section>

      <section className="progress-page__grid">
        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div style={{ flex: 1 }}>
              <Sk w={96} h={20} />
              <Sk w="70%" h={13} style={{ maxWidth: 380, marginTop: 10 }} />
            </div>
            <Sk w={126} h={30} r={999} />
          </div>

          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            {[1, 2, 3].map((item) => (
              <Sk key={item} h={96} r="22px" />
            ))}
          </div>
        </div>

        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div style={{ flex: 1 }}>
              <Sk w={155} h={20} />
              <Sk w="78%" h={13} style={{ maxWidth: 360, marginTop: 10 }} />
            </div>
            <Sk w={156} h={40} r={14} />
          </div>

          <div className="progress-page__collapsed-form">
            <Sk w="80%" h={14} style={{ maxWidth: 480 }} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const targetProjectId = queryParams.get("projectId");
  const targetStageId = queryParams.get("stageId");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [updateToDelete, setUpdateToDelete] = useState(null);
  const [stepDisplayOrder, setStepDisplayOrder] = useState([]);
  const [filtroMarcos, setFiltroMarcos] = useState("todos");

  const { data, loading, error } = useAsyncData(
    async () => {
      if (!user?.id) return { projects: [], initialProgress: null, initialProjectId: "" };

      const projectsResult = await userService.getProjects(user.id).catch(() => []);
      const projects = Array.isArray(projectsResult) ? projectsResult.map(mapProject) : [];
      const initialProject =
        (targetProjectId
          ? projects.find((project) => String(project.id) === String(targetProjectId))
          : null) ??
        projects[0] ??
        null;

      if (!initialProject?.id) {
        return { projects, initialProgress: null, initialProjectId: "" };
      }

      const initialProgress = await progressService
        .getProgress(initialProject.id)
        .then((result) => ({ ...result, projectId: result?.projectId ?? initialProject.id }))
        .catch(() => null);

      return { projects, initialProgress, initialProjectId: String(initialProject.id) };
    },
    [user?.id, targetProjectId],
    { initialData: { projects: [], initialProgress: null, initialProjectId: "" } },
  );

  const projects = data?.projects ?? [];
  const targetProjectExists = Boolean(
    targetProjectId && projects.some((project) => String(project.id) === String(targetProjectId)),
  );
  const effectiveSelectedProjectId = targetProjectExists
    ? String(targetProjectId)
    : selectedProjectId || data?.initialProjectId || "";

  useEffect(() => {
    if (targetProjectId && projects.some((project) => String(project.id) === String(targetProjectId))) {
      setSelectedProjectId(String(targetProjectId));
      return;
    }
    if (!selectedProjectId && projects[0]?.id) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId, targetProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(effectiveSelectedProjectId)) ?? projects[0] ?? null,
    [projects, effectiveSelectedProjectId],
  );

  // useProjectProgress segue responsável só pelas atualizações narrativas;
  // marcos, tarefas e resumo vêm de useMarcos (contrato de marcos com checklist).
  const {
    updates,
    isLoading: progressLoading,
    error: progressError,
    createUpdate,
    deleteUpdate,
    editUpdate,
  } = useProjectProgress(selectedProject?.id, { initialProgress: data?.initialProgress });

  const {
    marcos: steps,
    resumo,
    loading: marcosLoading,
    error: marcosError,
    recarregar: recarregarMarcos,
    executar: executarMarcos,
    alternarTarefa,
  } = useMarcos(selectedProject?.id);

  const stepOrderStorageKey = selectedProject?.id && user?.id
    ? `collabresearch:step-display-order:${user.id}:${selectedProject.id}`
    : null;

  useEffect(() => {
    if (!stepOrderStorageKey) {
      setStepDisplayOrder([]);
      return;
    }

    try {
      const stored = JSON.parse(window.localStorage.getItem(stepOrderStorageKey) ?? "[]");
      setStepDisplayOrder(Array.isArray(stored) ? stored.map(String) : []);
    } catch {
      setStepDisplayOrder([]);
    }
  }, [stepOrderStorageKey]);

  const orderedSteps = useMemo(() => {
    const positions = new Map(stepDisplayOrder.map((id, index) => [id, index]));
    return [...steps].sort((first, second) => {
      const firstPosition = positions.get(String(first.id));
      const secondPosition = positions.get(String(second.id));
      if (firstPosition !== undefined && secondPosition !== undefined) return firstPosition - secondPosition;
      if (firstPosition !== undefined) return -1;
      if (secondPosition !== undefined) return 1;
      return Number(first.ordem ?? 0) - Number(second.ordem ?? 0);
    });
  }, [steps, stepDisplayOrder]);

  const handleReorderStep = (fromIndex, toIndex) => {
    if (selectedProject?.status === "FINALIZADO") {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return;
    }
    if (currentUserRole !== "ALUNO" || toIndex < 0 || toIndex >= orderedSteps.length) return;
    if (fromIndex === toIndex) return;

    const next = [...orderedSteps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const nextOrder = next.map((step) => String(step.id));
    setStepDisplayOrder(nextOrder);
    if (stepOrderStorageKey) window.localStorage.setItem(stepOrderStorageKey, JSON.stringify(nextOrder));
  };

  const currentUserRole = String(user?.tipo ?? user?.type ?? "").toUpperCase();
  const acceptedCollaborators = selectedProject?.acceptedCollaborators ?? [];
  const advisorName = selectedProject?.advisor?.name ?? "Sem orientador";
  const isProjectFinished = selectedProject?.status === "FINALIZADO";
  const updateFormSteps = useMemo(
    () => sortStepsByNearestDeadline(steps.map((marco) => ({ id: marco.id, title: marco.titulo, stepOrder: marco.ordem, prazo: marco.prazo }))),
    [steps],
  );
  const marcosFiltrados = useMemo(() => filtrarMarcos(orderedSteps, filtroMarcos), [orderedSteps, filtroMarcos]);
  const contagemFiltros = useMemo(() => contarFiltros(steps), [steps]);

  useEffect(() => {
    if (!targetStageId || progressLoading) return;
    const element = document.getElementById(`progress-step-${targetStageId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetStageId, progressLoading, orderedSteps]);

  const projetoId = selectedProject?.id;
  const acoesMarco = useMemo(() => {
    const bloqueado = () => {
      if (!isProjectFinished) return false;
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return true;
    };
    // Erros de renomear/adicionar sobem para o formulário exibir a mensagem junto ao campo.
    return {
      alternar: async (marco, tarefa, concluida) => {
        if (bloqueado()) return;
        try {
          await alternarTarefa(marco.id, tarefa.id, concluida);
        } catch (err) {
          toast.error(mensagemDeErro(err, "Não foi possível atualizar a tarefa."));
        }
      },
      adicionar: async (marco, dados) => {
        if (bloqueado()) return;
        await executarMarcos(() => marcosApi.createTarefa(projetoId, marco.id, { titulo: dados.titulo, obrigatoria: false }));
        toast.success("Tarefa pessoal adicionada.");
      },
      renomear: async (marco, tarefa, titulo) => {
        if (bloqueado()) return;
        await executarMarcos(() => marcosApi.updateTarefa(projetoId, marco.id, tarefa.id, { titulo }));
      },
      remover: async (marco, tarefa) => {
        if (bloqueado()) return;
        try {
          await executarMarcos(() => marcosApi.deleteTarefa(projetoId, marco.id, tarefa.id));
          toast.success("Tarefa removida.");
        } catch (err) {
          toast.error(mensagemDeErro(err, "Não foi possível remover a tarefa."));
        }
      },
      enviar: async (marco) => {
        if (bloqueado()) return;
        try {
          await executarMarcos(() => marcosApi.submitMarcoForReview(projetoId, marco.id));
          toast.success("Marco enviado para revisão do orientador.");
        } catch (err) {
          toast.error(mensagemDeErro(err, "Não foi possível enviar o marco para revisão."));
        }
      },
      historico: (marco) => marcosApi.listRevisoes(projetoId, marco.id),
    };
  }, [alternarTarefa, executarMarcos, isProjectFinished, projetoId]);

  const handleCreateUpdate = async (payload) => {
    if (isProjectFinished) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return;
    }

    try {
      if (editingUpdate) {
        await editUpdate(editingUpdate.id, payload);
        toast.success("Atualização salva com sucesso.");
        setEditingUpdate(null);
        setShowUpdateForm(false);
      } else {
        await createUpdate(payload);
        toast.success("Atualização publicada com sucesso.");
        setShowUpdateForm(false);
      }
    } catch (err) {
      toast.error(err.message || "Não foi possível salvar a atualização.");
      throw err;
    }
  };

  const handleEditUpdate = (update) => {
    setEditingUpdate(update);
    setShowUpdateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUpdate(null);
    setShowUpdateForm(false);
  };

  const handleDeleteUpdate = (update) => setUpdateToDelete(update);

  const confirmDeleteUpdate = async () => {
    const update = updateToDelete;
    setUpdateToDelete(null);
    if (!update) return;
    try {
      await deleteUpdate(update.id);
      toast.success("Atualização excluída.");
    } catch (err) {
      toast.error(err.message || "Não foi possível excluir a atualização.");
    }
  };

  const hasProgressContent = steps.length > 0 || updates.length > 0 || Boolean(resumo);
  const overallPercent = resumo?.percentualGeral ?? 0;
  const atualizacoesTotal = Math.max(resumo?.atualizacoesTotal ?? 0, updates.length);

  if (loading || ((progressLoading || marcosLoading) && !hasProgressContent)) {
    return <ProgressSkeleton />;
  }

  if (error) {
    return <StatusView title="Falha ao carregar progresso" description={error.message} />;
  }

  if (progressError) {
    return <StatusView title="Falha ao carregar progresso" description={progressError.message} />;
  }

  if (!selectedProject) {
    return (
      <div className="progress-page">
        <div className="progress-page__empty">
          <div className="progress-page__empty-icon"><ClipboardText size={24} /></div>
          <h2 className="progress-page__empty-title">Nenhum projeto vinculado</h2>
          <p className="progress-page__empty-description">As etapas aparecerão aqui quando você participar de um projeto aprovado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <header className="progress-page__hero">
        <div className="progress-page__hero-copy">
          <span className="progress-page__eyebrow">Acompanhamento estruturado</span>
          <h1 className="progress-page__title">Progresso do projeto</h1>
          <p className="progress-page__lead">
            Cada marco tem um checklist: conclua as tarefas, envie o marco para revisão do orientador e registre atualizações narrativas sobre o andamento.
          </p>
        </div>

        <div className="progress-page__project-picker">
          <span>Projeto</span>
          <div className="progress-page__project-picker-control">
            <AppCombobox
              ariaLabel="Selecionar projeto"
              className="app-combobox--progress"
              value={effectiveSelectedProjectId || selectedProject.id}
              onChange={setSelectedProjectId}
              options={projects.map((project) => ({ value: project.id, label: project.title }))}
            />
          </div>
        </div>

      </header>

      <section className="progress-page__overview">
        <div className="progress-page__panel progress-page__panel--summary">
          <ProgressDonut
            percent={overallPercent}
            subtitle={`${resumo ? `${resumo.itensConcluidos} de ${resumo.itensTotal} itens · ` : ""}${atualizacoesTotal} ${atualizacoesTotal === 1 ? "atualização registrada" : "atualizações registradas"}`}
          />
        </div>

        <div className="progress-page__panel progress-page__panel--stats">
          <div className="progress-page__panel-title-row">
            <div>
              <h2>{selectedProject.title}</h2>
              <p>Orientador: {selectedProject.advisor?.name ?? "Sem orientador"}</p>
            </div>
            <span className={`progress-page__status-chip ${projectStatusClass(selectedProject.status)}`}>
              {formatProjectStatus(selectedProject.status)}
            </span>
          </div>

          <div className="progress-page__stats-grid progress-page__stats-grid--tres">
            <div className="progress-stat">
              <CheckSquare size={16} />
              <span>Itens concluídos</span>
              <strong>{resumo ? `${resumo.itensConcluidos} de ${resumo.itensTotal}` : "-"}</strong>
            </div>
            <div className="progress-stat">
              <Flag size={16} />
              <span>Marcos aprovados</span>
              <strong>{resumo ? `${resumo.marcosConcluidos} de ${resumo.marcosTotal}` : "-"}</strong>
            </div>
            <div className="progress-stat">
              <Hourglass size={16} />
              <span>Em revisão</span>
              <strong>{resumo?.marcosEmRevisao ?? "-"}</strong>
            </div>
            <div className={`progress-stat${resumo?.marcosComAtencao > 0 ? " progress-stat--alerta" : ""}`}>
              <WarningCircle size={16} />
              <span>Precisam de atenção</span>
              <strong>{resumo?.marcosComAtencao ?? "-"}</strong>
            </div>
            <div className="progress-stat">
              <CalendarBlank size={16} />
              <span>Criado em</span>
              <strong>{formatDate(selectedProject.createdAt)}</strong>
            </div>
            <div className="progress-stat">
              <Users size={16} />
              <span>Colaboradores</span>
              <strong>{acceptedCollaborators.length + 1}</strong>
            </div>
          </div>

          <div className="progress-page__summary-line">
            <span>Responsável:</span>
            <strong>{advisorName}</strong>
          </div>
        </div>
      </section>

      <section className="progress-page__grid">
        <div className="progress-page__panel progress-page__panel--feed">
          <div className="progress-page__panel-header">
            <div>
              <h2>Progresso</h2>
              <p>{isProjectFinished ? "Projeto finalizado. As etapas ficam disponíveis apenas para consulta." : "Abra um marco para ver o checklist, marcar tarefas, criar tarefas pessoais e enviar para revisão. Use Mover para reorganizar sua visualização."}</p>
            </div>
          </div>
          {steps.length > 0 ? (
            <FiltrosMarco valor={filtroMarcos} onChange={setFiltroMarcos} contagens={contagemFiltros} />
          ) : null}
          {marcosLoading ? (
            <div className="stepper-vertical" aria-busy="true" aria-label="Carregando marcos">
              {[1, 2, 3].map((item) => <Sk key={item} h={96} r="22px" />)}
            </div>
          ) : marcosError ? (
            <div className="marco-lista-vazia" role="alert">
              <p>{mensagemDeErro(marcosError, "Não foi possível carregar os marcos.")}</p>
              <button type="button" className="marco-btn" onClick={() => recarregarMarcos()}>Tentar novamente</button>
            </div>
          ) : steps.length === 0 ? (
            <div className="marco-lista-vazia">
              <p>Este projeto ainda não tem marcos. Quando o orientador definir os marcos e tarefas, eles aparecerão aqui.</p>
            </div>
          ) : marcosFiltrados.length === 0 ? (
            <div className="marco-lista-vazia"><p>Nenhum marco neste filtro.</p></div>
          ) : (
            <MarcoLista
              marcos={marcosFiltrados}
              podeReordenar={!isProjectFinished && filtroMarcos === "todos" && currentUserRole === "ALUNO"}
              somenteLeitura={isProjectFinished}
              destacadoId={targetStageId}
              onReordenar={handleReorderStep}
              acoes={acoesMarco}
            />
          )}
        </div>

        <div className={`progress-page__panel progress-page__panel--updates${isProjectFinished ? " progress-page__panel--updates-finished" : ""}`}>
          <div className="progress-page__panel-header">
            <div>
              <h2>Atualizações</h2>
              <p>{isProjectFinished ? "Projeto finalizado. As etapas ficam disponíveis apenas para consulta." : "Relato narrativo do andamento. Publicar uma atualização não conclui nem reabre tarefas: para isso, use o checklist do marco."}</p>
            </div>
            {!isProjectFinished && (
              <button
                type="button"
                className="progress-page__toggle-form"
                onClick={() => {
                  setEditingUpdate(null);
                  setShowUpdateForm(true);
                }}
              >
                <Plus size={14} weight="bold" aria-hidden="true" />
                Nova atualização
              </button>
            )}
          </div>

          {isProjectFinished ? null : (
            <UpdateFormModal open={showUpdateForm} editing={Boolean(editingUpdate)} onClose={handleCancelEdit}>
              <UpdateForm
                steps={updateFormSteps}
                onSubmit={handleCreateUpdate}
                onCancel={handleCancelEdit}
                initialValues={editingUpdate}
              />
            </UpdateFormModal>
          )}

          <div className="progress-page__updates">
            <h3>Atualizações recentes</h3>
            <UpdateFeed
              updates={updates}
              currentUserId={user?.id}
              onEdit={handleEditUpdate}
              onDelete={handleDeleteUpdate}
            />
          </div>
        </div>
      </section>
      <ConfirmDeleteModal
        open={Boolean(updateToDelete)}
        title="Excluir atualização?"
        description={`A atualização "${updateToDelete?.title ?? ""}" será removida permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Confirmar exclusão"
        onConfirm={confirmDeleteUpdate}
        onCancel={() => setUpdateToDelete(null)}
      />
    </div>
  );
}
