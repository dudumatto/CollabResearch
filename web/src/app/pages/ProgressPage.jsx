import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FolderKanban, Plus, TrendingUp, Users } from "lucide-react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useProjectProgress } from "../hooks/useProjectProgress";
import { userService } from "../services/userService";
import { progressService } from "../services/progressService";
import { getProjectSlotsUsage, mapProject } from "../utils/adapters";
import { formatDate, formatProjectStatus, formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import { ProgressDonut } from "../components/progress/ProgressDonut";
import { StepperVertical } from "../components/progress/StepperVertical";
import { UpdateForm } from "../components/progress/UpdateForm";
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

          <div className="progress-page__stats-grid">
            {[1, 2, 3, 4].map((item) => (
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
              <div key={item} className="step-card">
                <Sk w={42} h={42} r="50%" />
                <div>
                  <Sk w="45%" h={16} style={{ maxWidth: 220 }} />
                  <Sk w="85%" h={12} style={{ maxWidth: 420, marginTop: 10 }} />
                  <Sk w="58%" h={12} style={{ maxWidth: 300, marginTop: 8 }} />
                </div>
                <Sk w={88} h={32} r={999} />
              </div>
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
  const [stepDisplayOrder, setStepDisplayOrder] = useState([]);

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

  const {
    steps,
    updates,
    overallPercent,
    isLoading: progressLoading,
    error: progressError,
    advanceStep,
    createUpdate,
  } = useProjectProgress(selectedProject?.id, { initialProgress: data?.initialProgress });

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
      return Number(first.stepOrder) - Number(second.stepOrder);
    });
  }, [steps, stepDisplayOrder]);

  const handleReorderStep = (fromIndex, toIndex) => {
    if (currentUserRole !== "ALUNO" || toIndex < 0 || toIndex >= orderedSteps.length) return;
    if (fromIndex === toIndex) return;

    const next = [...orderedSteps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const nextOrder = next.map((step) => String(step.id));
    setStepDisplayOrder(nextOrder);
    if (stepOrderStorageKey) window.localStorage.setItem(stepOrderStorageKey, JSON.stringify(nextOrder));
  };

  const selectedProjectSlots = selectedProject
    ? getProjectSlotsUsage(selectedProject)
    : { total: 0, used: 0, remaining: 0 };

  const currentStep = useMemo(
    () => steps.find((step) => step.status === "ACTIVE") ?? steps.find((step) => step.status === "PENDING") ?? null,
    [steps],
  );

  const currentUserRole = String(user?.tipo ?? user?.type ?? "").toUpperCase();
  const acceptedCollaborators = selectedProject?.acceptedCollaborators ?? [];

  useEffect(() => {
    if (!targetStageId || progressLoading) return;
    const element = document.getElementById(`progress-step-${targetStageId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetStageId, progressLoading, orderedSteps]);

  const handleAdvanceStep = async (stepId) => {
    try {
      await advanceStep(stepId);
      toast.success("Etapa concluída com sucesso.");
    } catch (err) {
      toast.error(err.message || "Não foi possível concluir a etapa.");
    }
  };

  const handleCreateUpdate = async (payload) => {
    try {
      await createUpdate(payload);
      toast.success("Atualização publicada com sucesso.");
      setShowUpdateForm(false);
    } catch (err) {
      toast.error(err.message || "Não foi possível publicar a atualização.");
      throw err;
    }
  };

  const hasProgressContent = steps.length > 0 || updates.length > 0 || overallPercent > 0;

  if (loading || (progressLoading && !hasProgressContent)) {
    return <ProgressSkeleton />;
  }

  if (error) {
    return <StatusView title="Falha ao carregar progresso" description={error.message} />;
  }

  if (progressError) {
    return <StatusView title="Falha ao carregar progresso" description={progressError.message} />;
  }

  if (!selectedProject) {
    return <StatusView title="Sem projetos vinculados" description="Não encontramos projetos associados ao usuário autenticado." />;
  }

  return (
    <div className="progress-page">
      <header className="progress-page__hero">
        <div className="progress-page__hero-copy">
          <span className="progress-page__eyebrow">Acompanhamento estruturado</span>
          <h1 className="progress-page__title">Progresso do projeto</h1>
          <p className="progress-page__lead">
            Progresso com peso calculado automaticamente, etapas organizadas por peso e atualizações vinculadas ao avanço real do projeto.
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
            subtitle={`${updates.length} atualizações registradas`}
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

          <div className="progress-page__stats-grid">
            <div className="progress-stat">
              <CalendarDays size={16} />
              <span>Criado em</span>
              <strong>{formatDate(selectedProject.createdAt)}</strong>
            </div>
            <div className="progress-stat">
              <TrendingUp size={16} />
              <span>Etapa atual</span>
              <strong>{currentStep?.title ?? "Todas concluídas"}</strong>
            </div>
            <div className="progress-stat">
              <Users size={16} />
              <span>Colaboradores</span>
              <strong>{acceptedCollaborators.length + 1}</strong>
            </div>
            <div className="progress-stat">
              <FolderKanban size={16} />
              <span>Vagas</span>
              <strong>
                {selectedProjectSlots.used}/{selectedProjectSlots.total}
              </strong>
            </div>
          </div>

          <div className="progress-page__summary-line">
            <span>Responsável atual:</span>
            <strong>{formatUserType(currentUserRole) || "Usuário autenticado"}</strong>
          </div>
        </div>
      </section>

      <section className="progress-page__grid">
        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div>
              <h2>Progresso</h2>
              <p>{currentUserRole === "ALUNO" ? "Use a alça Mover para reorganizar sua visualização ou conclua a etapa ativa quando permitido." : "Conclua a etapa ativa quando o papel do usuário permitir."}</p>
            </div>
          </div>
          <StepperVertical steps={orderedSteps} currentUserRole={currentUserRole} onAdvanceStep={handleAdvanceStep} onReorderStep={handleReorderStep} highlightedStepId={targetStageId} />
        </div>

        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div>
              <h2>Nova atualização</h2>
              <p>Adicione título, categoria e vínculo com a etapa quando fizer sentido.</p>
            </div>
            <button
              type="button"
              className="progress-page__toggle-form"
              onClick={() => setShowUpdateForm((current) => !current)}
            >
              <Plus size={15} />
              {showUpdateForm ? "Ocultar" : "Nova atualização"}
            </button>
          </div>

          {showUpdateForm ? (
            <UpdateForm steps={steps} onSubmit={handleCreateUpdate} />
          ) : (
            <div className="progress-page__collapsed-form">
              <p>O formulário está recolhido. Use o botão acima para publicar uma atualização.</p>
            </div>
          )}

          <div className="progress-page__updates">
            <h3>Atualizações recentes</h3>
            <UpdateFeed updates={updates} />
          </div>
        </div>
      </section>
    </div>
  );
}
