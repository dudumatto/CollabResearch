"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FolderKanban,
  FolderOpen,
  MessageSquareText,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useProjectProgress } from "../hooks/useProjectProgress";
import { userService } from "../services/userService";
import { projectService } from "../services/projectService";
import { getProjectSeatHolders, getProjectSlotsUsage, mapProject } from "../utils/adapters";
import { formatDate, formatProjectStatus, formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ProgressDonut } from "../components/progress/ProgressDonut";
import { StepperVertical } from "../components/progress/StepperVertical";
import { UpdateFeed } from "../components/progress/UpdateFeed";
import { UpdateForm } from "../components/progress/UpdateForm";
import "./ProgressPage.css";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", style }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function ProgressEmptyState({ icon: Icon = ClipboardList, title, description, action }) {
  return (
    <div className="progress-empty">
      <span className="progress-empty__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="progress-empty__copy">
        <p className="progress-empty__title">{title}</p>
        <p className="progress-empty__description">{description}</p>
      </div>
      {action ? <div className="progress-empty__action">{action}</div> : null}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="progress-page">
      <header className="progress-page__hero">
        <div className="progress-page__hero-copy">
          <Sk w={180} h={22} r={999} style={{ maxWidth: "50%", opacity: 0.6 }} />
          <Sk w="65%" h={32} r={10} style={{ maxWidth: 380, marginTop: 12 }} />
          <Sk w="90%" h={12} r={999} style={{ maxWidth: 500, marginTop: 14 }} />
          <Sk w="60%" h={12} r={999} style={{ maxWidth: 360, marginTop: 8 }} />
        </div>
        <div className="progress-page__project-picker">
          <Sk w={56} h={11} />
          <Sk w="100%" h={42} r={14} />
        </div>
      </header>

      <section className="progress-page__overview">
        <div className="progress-page__panel progress-page__panel--summary">
          <div className="progress-page__skeleton-donut">
            <Sk w={170} h={170} r="50%" style={{ background: "transparent", border: "10px solid var(--progress-border-soft)" }} />
            <Sk w={60} h={28} r={8} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
          <Sk w="55%" h={14} style={{ maxWidth: 130, marginTop: 14 }} />
          <Sk w="40%" h={11} style={{ maxWidth: 110, marginTop: 6 }} />
        </div>

        <div className="progress-page__panel progress-page__panel--stats">
          <div className="progress-page__panel-title-row">
            <div style={{ flex: 1 }}>
              <Sk w="48%" h={18} style={{ maxWidth: 200 }} />
              <Sk w="30%" h={11} style={{ maxWidth: 150, marginTop: 8 }} />
            </div>
            <Sk w={76} h={24} r={999} />
          </div>

          <div className="progress-page__stats-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="progress-stat">
                <Sk w={16} h={16} r={4} />
                <Sk w="60%" h={11} />
                <Sk w="40%" h={16} />
              </div>
            ))}
          </div>

          <div className="progress-page__summary-line">
            <Sk w={100} h={12} />
            <Sk w={120} h={12} />
          </div>
        </div>
      </section>

      <section className="progress-page__grid">
        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div style={{ flex: 1 }}>
              <Sk w={72} h={18} />
              <Sk w="65%" h={11} style={{ maxWidth: 300, marginTop: 8 }} />
            </div>
            <Sk w={100} h={24} r={999} />
          </div>

          <div className="stepper-vertical">
            {[1, 2, 3].map((item) => (
              <div key={item} className="step-card">
                <Sk w={38} h={38} r="50%" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Sk w="50%" h={14} style={{ maxWidth: 200 }} />
                  <Sk w="80%" h={11} style={{ maxWidth: 350, marginTop: 8 }} />
                  <Sk w="55%" h={11} style={{ maxWidth: 240, marginTop: 6 }} />
                </div>
                <Sk w={78} h={28} r={14} />
              </div>
            ))}
          </div>
        </div>

        <div className="progress-page__panel">
          <div className="progress-page__panel-header">
            <div style={{ flex: 1 }}>
              <Sk w={130} h={18} />
              <Sk w="70%" h={11} style={{ maxWidth: 300, marginTop: 8 }} />
            </div>
            <Sk w={140} h={34} r={14} />
          </div>

          <div className="progress-page__collapsed-form">
            <Sk w="70%" h={11} style={{ maxWidth: 380 }} />
          </div>
        </div>
      </section>

      <section className="progress-page__panel progress-page__panel--feed">
        <div className="progress-page__panel-header">
          <div style={{ flex: 1 }}>
            <Sk w={160} h={18} />
            <Sk w="60%" h={11} style={{ maxWidth: 380, marginTop: 8 }} />
          </div>
        </div>

        <div className="update-feed">
          {[1, 2].map((item) => (
            <div key={item} className="update-feed__item">
              <div className="update-feed__header">
                <Sk w={34} h={34} r="50%" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Sk w="45%" h={14} style={{ maxWidth: 200 }} />
                  <Sk w="30%" h={10} style={{ maxWidth: 140, marginTop: 6 }} />
                </div>
                <Sk w={72} h={22} r={999} />
              </div>
              <Sk w="85%" h={11} style={{ maxWidth: 560, marginTop: 12 }} />
              <Sk w="55%" h={11} style={{ maxWidth: 380, marginTop: 6 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Sk w={140} h={20} r={999} />
                <Sk w={120} h={20} r={999} />
                <Sk w={160} h={20} r={999} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    async () => {
      if (!user?.id) return { projects: [] };

      const projectsResult = await userService.getProjects(user.id).catch(() => []);
      const mappedProjects = Array.isArray(projectsResult) ? projectsResult.map(mapProject) : [];

      const projects = await Promise.all(
        mappedProjects.map(async (project) => {
          const collaborators = await projectService.getCollaborators(project.id).catch(() => null);

          if (!Array.isArray(collaborators)) {
            return project;
          }

          const slots = getProjectSlotsUsage(project, collaborators);
          return {
            ...project,
            collaborators,
            acceptedCollaborators: getProjectSeatHolders(project, collaborators),
            slotsUsed: slots.used,
            slotsRemaining: slots.remaining,
          };
        }),
      );

      return { projects };
    },
    [user?.id],
    { initialData: { projects: [] } },
  );

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);

  useEffect(() => {
    if (!selectedProjectId && projects[0]?.id) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)) ?? projects[0] ?? null,
    [projects, selectedProjectId],
  );

  const {
    steps,
    updates,
    overallPercent,
    isLoading: progressLoading,
    error: progressError,
    advanceStep,
    createUpdate,
  } = useProjectProgress(selectedProject?.id);

  const selectedProjectSlots = selectedProject
    ? getProjectSlotsUsage(selectedProject)
    : { total: 0, used: 0, remaining: 0 };

  const currentStep = useMemo(
    () => steps.find((step) => step.status === "ACTIVE") ?? steps.find((step) => step.status === "PENDING") ?? null,
    [steps],
  );

  const currentUserRole = user?.tipo ?? user?.type ?? "";
  const acceptedCollaborators = selectedProject?.acceptedCollaborators ?? [];
  const hasSteps = steps.length > 0;
  const hasUpdates = updates.length > 0;

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

  if (loading || progressLoading) {
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
      <div className="progress-page progress-page--empty-projects">
        <section className="progress-page__panel progress-page__panel--empty-projects">
          <ProgressEmptyState
            icon={FolderOpen}
            title="Sem projetos vinculados"
            description="Não encontramos projetos associados ao usuário autenticado. Quando você criar, orientar ou tiver participação aprovada em um projeto, o acompanhamento aparecerá aqui."
            action={(
              <button type="button" className="progress-page__refresh-button" onClick={() => reload().catch(() => {})}>
                Recarregar dados
              </button>
            )}
          />
        </section>
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
            Etapas com peso calculado automaticamente, atualizações com título e categoria e um feed que conecta cada
            movimento ao avanço real do projeto.
          </p>
        </div>

        <label className="progress-page__project-picker">
          <span>Projeto</span>
          <div className="progress-page__project-picker-control">
            <select
              value={selectedProjectId || selectedProject.id}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </label>
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
            <span className="progress-page__status-chip">{formatProjectStatus(selectedProject.status)}</span>
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
              <strong>{hasSteps ? currentStep?.title ?? "Todas concluídas" : "Sem etapas"}</strong>
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
              <h2>Etapas</h2>
              <p>Conclua a etapa ativa quando o papel do usuário permitir.</p>
            </div>
            <span className="progress-page__hint">{hasSteps ? "+ peso calculado" : "Aguardando etapas"}</span>
          </div>
          {hasSteps ? (
            <StepperVertical steps={steps} currentUserRole={currentUserRole} onAdvanceStep={handleAdvanceStep} />
          ) : (
            <ProgressEmptyState
              icon={ClipboardList}
              title="Nenhuma etapa disponível"
              description="Este projeto ainda não possui etapas retornadas pelo backend. O painel continuará exibindo o projeto e aceitará atualizações sem vínculo com etapa."
            />
          )}
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
              <p>
                {hasSteps
                  ? "O formulário está recolhido. Use o botão acima para publicar uma atualização."
                  : "O formulário está recolhido. Sem etapas disponíveis, a atualização será publicada sem vínculo de etapa."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="progress-page__panel progress-page__panel--feed">
        <div className="progress-page__panel-header">
          <div>
            <h2>Feed de atualizações</h2>
            <p>Cada item mostra a categoria, a etapa relacionada e a contribuição dentro da etapa.</p>
          </div>
        </div>

        {hasUpdates ? (
          <UpdateFeed updates={updates} />
        ) : (
          <ProgressEmptyState
            icon={MessageSquareText}
            title="Nenhuma atualização publicada"
            description="Quando alguém registrar uma atualização neste projeto, ela aparecerá aqui com categoria, data e relação com etapa quando houver."
          />
        )}
      </section>

      <div className="progress-page__refresh-row">
        <button type="button" className="progress-page__refresh-button" onClick={() => reload().catch(() => {})}>
          Recarregar dados
        </button>
      </div>
    </div>
  );
}
