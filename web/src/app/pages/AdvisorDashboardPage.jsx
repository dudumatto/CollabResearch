import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Star,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientadorDashboard } from "../utils/adapters";
import { formatProjectStatus, formatApplicationStatus, formatEntregaStatus } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { WelcomeBanner } from "../components/WelcomeBanner";
import "./AdvisorWorkspace.css";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined }} />
);

function AdvisorDashboardSkeleton() {
  return (
    <div className="advisor-pagina advisor-pagina--dashboard">
      <Sk w="100%" h={128} r="var(--raio-grande)" mb={16} />
      <div className="advisor-dashboard-overview">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="advisor-metrica advisor-metrica--overview">
            <Sk w={34} h={34} r="var(--raio-medio)" />
            <div style={{ flex: 1 }}>
              <Sk w={28} h={22} mb={6} />
              <Sk w="70%" h={12} />
            </div>
          </div>
        ))}
      </div>
      <div className="advisor-dashboard-data-grid">
        <div className="advisor-dashboard-main">
          {[1, 2].map((item) => (
            <div key={item} className="advisor-dashboard-panel">
              <Sk w={110} h={11} mb={8} />
              <Sk w={170} h={20} mb={8} />
              <Sk w="65%" h={12} mb={18} />
              <Sk w="100%" h={78} r="var(--raio-medio)" />
            </div>
          ))}
        </div>
        <div className="advisor-dashboard-side">
          {[1, 2].map((item) => (
            <div key={item} className="advisor-side-card">
              <Sk w={130} h={18} mb={14} />
              <Sk w="100%" h={86} r="var(--raio-medio)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusLabelFor(status, kind) {
  if (kind === "project") return formatProjectStatus(status);
  if (kind === "application") return formatApplicationStatus(status);
  if (kind === "delivery") return formatEntregaStatus(status);
  if (kind === "etapa") return formatProjectStatus(status);
  return status ?? "";
}

function buildMetricCards(metricas) {
  return [
    {
      label: "Projetos ativos",
      value: metricas.projetosAtivos,
      icon: FolderOpen,
      areaClass: "advisor-metrica__icone-area--azul",
      iconClass: "advisor-metrica__icone--azul",
      href: "/app/projects",
      priority: "normal",
    },
    {
      label: "Solicitações de orientação",
      value: metricas.solicitacoesOrientacao,
      icon: FileText,
      areaClass: "advisor-metrica__icone-area--violeta",
      iconClass: "advisor-metrica__icone--violeta",
      href: "/app/projects",
      priority: "action",
    },
    {
      label: "Inscrições aguardando análise",
      value: metricas.inscricoesPendentes,
      icon: Users,
      areaClass: "advisor-metrica__icone-area--laranja",
      iconClass: "advisor-metrica__icone--laranja",
      href: "/app/applications",
      priority: "action",
    },
    {
      label: "Orientandos ativos",
      value: metricas.orientandosAtivos,
      icon: GraduationCap,
      areaClass: "advisor-metrica__icone-area--verde",
      iconClass: "advisor-metrica__icone--verde",
      href: "/app/advisees",
      priority: "normal",
    },
    {
      label: "Etapas atrasadas",
      value: metricas.etapasAtrasadas,
      icon: AlertTriangle,
      areaClass: "advisor-metrica__icone-area--erro",
      iconClass: "advisor-metrica__icone--erro",
      href: "/app/progress",
      priority: "risk",
    },
    {
      label: "Entregas aguardando revisão",
      value: metricas.entregasAguardandoRevisao,
      icon: ClipboardCheck,
      areaClass: "advisor-metrica__icone-area--laranja",
      iconClass: "advisor-metrica__icone--laranja",
      href: "/app/deliveries",
      priority: "action",
    },
  ];
}

const filasConfig = [
  { key: "projetosAtivos", title: "Projetos ativos", icon: FolderOpen, kind: "project" },
  { key: "solicitacoesOrientacao", title: "Solicitações de orientação", icon: FileText, kind: "project" },
  { key: "inscricoesPendentes", title: "Inscrições pendentes", icon: Users, kind: "application" },
  { key: "orientandosAtivos", title: "Orientandos ativos", icon: GraduationCap, kind: "advisee" },
  { key: "etapasAtrasadas", title: "Etapas atrasadas", icon: AlertTriangle, kind: "etapa" },
  { key: "entregasAguardandoRevisao", title: "Entregas aguardando revisão", icon: ClipboardCheck, kind: "delivery" },
  { key: "avaliacoesAguardandoCiencia", title: "Avaliações aguardando ciência", icon: Star, kind: "evaluation" },
];

function QueueItem({ item, kind, icon: Icon, onNavigate, featured = false, index = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => item.destino && onNavigate(item.destino)}
      className={`advisor-data-item ${featured ? "advisor-data-item--featured" : ""}`}
      disabled={!item.destino}
    >
      <span className="advisor-data-item__icon">
        <Icon size={15} />
      </span>
      <span className="advisor-data-item__content">
        <span className="advisor-data-item__title">{item.titulo}</span>
        {item.subtitulo && <span className="advisor-data-item__subtitle">{item.subtitulo}</span>}
      </span>
      {item.status && <span className="advisor-data-item__status">{statusLabelFor(item.status, kind)}</span>}
      {item.destino && <ChevronRight size={15} className="advisor-data-item__arrow" />}
    </motion.button>
  );
}

function DashboardPanelHeader({ eyebrow, title, description }) {
  return (
    <div className="advisor-dashboard-panel__header">
      <p className="advisor-dashboard-panel__eyebrow">{eyebrow}</p>
      <h2 className="advisor-dashboard-panel__title">{title}</h2>
      <p className="advisor-dashboard-panel__description">{description}</p>
    </div>
  );
}

function PriorityPanel({ queues, filas, onNavigate }) {
  return (
    <section className="advisor-dashboard-panel">
      <DashboardPanelHeader
        eyebrow="Para resolver"
        title="Prioridades"
        description="Pendências que bloqueiam inscrição, entrega ou avanço dos projetos."
      />
      <div className="advisor-priority-list">
        {queues.map((config) => {
          const items = filas[config.key] ?? [];

          if (items.length === 0) {
            return (
              <div key={config.key} className="advisor-priority-empty-row">
                <CheckCircle2 size={16} />
                <span>{config.title}</span>
                <small>Nenhuma pendência</small>
              </div>
            );
          }

          return (
            <div key={config.key} className={`advisor-priority-group advisor-priority-group--${config.kind}`}>
              <div className="advisor-priority-group__header">
                <span>{config.title}</span>
                <small>{items.length} {items.length === 1 ? "pendência" : "pendências"}</small>
              </div>
              <div className="advisor-priority-group__items">
                {items.map((item, index) => (
                  <QueueItem
                    key={`${item.id}-${index}`}
                    item={item}
                    kind={config.kind}
                    icon={config.icon}
                    onNavigate={onNavigate}
                    featured={config.key === "inscricoesPendentes" && index === 0}
                    index={index}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FollowUpPanel({ queues, filas, onNavigate }) {
  const hasItems = queues.some((config) => (filas[config.key] ?? []).length > 0);

  return (
    <section className="advisor-dashboard-panel">
      <DashboardPanelHeader
        eyebrow="Em andamento"
        title="Acompanhamento"
        description="Projetos, orientandos e avaliações que fazem parte da rotina de orientação."
      />
      {!hasItems ? (
        <div className="advisor-dashboard-empty">
          <CheckCircle2 size={20} />
          <div>
            <strong>Nenhum acompanhamento em andamento</strong>
            <span>Os projetos, orientandos e avaliações aparecerão aqui.</span>
          </div>
        </div>
      ) : (
        <div className="advisor-followup-grid">
          {queues.map((config) => {
            const items = filas[config.key] ?? [];

            return (
              <div key={config.key} className="advisor-followup-group">
                <div className="advisor-followup-group__header">
                  <span className="advisor-followup-group__icon"><config.icon size={15} /></span>
                  <strong>{config.title}</strong>
                  <small>{items.length}</small>
                </div>
                {items.length === 0 ? (
                  <p className="advisor-followup-group__empty">Nenhum item no momento.</p>
                ) : (
                  <div className="advisor-followup-group__items">
                    {items.map((item, index) => (
                      <QueueItem
                        key={`${item.id}-${index}`}
                        item={item}
                        kind={config.kind}
                        icon={config.icon}
                        onNavigate={onNavigate}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EmptySideCard({ eyebrow, title, icon: Icon, description, actionLabel, onAction }) {
  return (
    <section className="advisor-side-card">
      <div className="advisor-side-card__header">
        <div>
          <p className="advisor-side-card__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="advisor-side-card__icon"><Icon size={17} /></span>
      </div>
      <div className="advisor-side-card__empty">
        <Icon size={22} />
        <strong>Nenhum item no momento</strong>
        <span>{description}</span>
      </div>
      <button type="button" className="advisor-side-card__action" onClick={onAction}>
        {actionLabel}
        <ArrowRight size={14} />
      </button>
    </section>
  );
}

export default function AdvisorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error } = useAsyncData(
    async () => mapOrientadorDashboard(await advisorService.dashboard()),
    [],
    {
      initialData: {
        metricas: {
          projetosAtivos: 0,
          solicitacoesOrientacao: 0,
          inscricoesPendentes: 0,
          orientandosAtivos: 0,
          etapasAtrasadas: 0,
          entregasAguardandoRevisao: 0,
          avaliacoesAguardandoCiencia: 0,
        },
        filas: {},
      },
    },
  );

  const normError = error ? normalizeError(error) : null;

  if (loading) return <AdvisorDashboardSkeleton />;

  if (normError) {
    return <StatusView title="Falha ao carregar o painel" description={getErrorMessage(normError)} />;
  }

  const metricas = data?.metricas ?? {};
  const filas = data?.filas ?? {};
  const metricCards = buildMetricCards(metricas);
  const highPriorityQueues = filasConfig.filter((config) =>
    ["solicitacoesOrientacao", "inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );
  const followUpQueues = filasConfig.filter((config) =>
    !["solicitacoesOrientacao", "inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );
  const pendingTotal =
    (metricas.solicitacoesOrientacao ?? 0) +
    (metricas.inscricoesPendentes ?? 0) +
    (metricas.entregasAguardandoRevisao ?? 0) +
    (metricas.etapasAtrasadas ?? 0);

  const handleNavigate = (destino) => navigate(destino);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina advisor-pagina--dashboard"
    >
      <WelcomeBanner
        name={user?.nome?.split(" ")[0] ?? "professor(a)"}
        summary={pendingTotal > 0
          ? <>Você tem <strong>{pendingTotal} pendências</strong> para revisar antes de seguir a rotina.</>
          : <>Nenhuma <strong>pendência crítica</strong> no momento.</>}
        primaryAction={{ label: "Inscrições", onClick: () => handleNavigate("/app/applications") }}
        secondaryAction={{ label: "Ver progresso", onClick: () => handleNavigate("/app/progress") }}
      />

      <div className="advisor-dashboard-overview">
        {metricCards.map((card, index) => {
          const value = Number(card.value ?? 0);
          const activePriority = value > 0 ? card.priority : "neutral";

          return (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.025 }}
              onClick={() => handleNavigate(card.href)}
              className={`advisor-metrica advisor-metrica--overview advisor-metrica--dashboard-${activePriority}`}
            >
              <div className={`advisor-metrica__icone-area ${card.areaClass}`}>
                <card.icon size={16} className={card.iconClass} />
              </div>
              <div className="advisor-metrica__conteudo">
                <p className="advisor-metrica__valor">{value}</p>
                <p className="advisor-metrica__rotulo">{card.label}</p>
              </div>
              <ChevronRight size={14} className="advisor-metrica__seta" />
            </motion.button>
          );
        })}
      </div>

      <div className="advisor-dashboard-data-grid">
        <div className="advisor-dashboard-main">
          <PriorityPanel queues={highPriorityQueues} filas={filas} onNavigate={handleNavigate} />
          <FollowUpPanel queues={followUpQueues} filas={filas} onNavigate={handleNavigate} />
        </div>

        <aside className="advisor-dashboard-side" aria-label="Resumo de agenda e atividades">
          <EmptySideCard
            eyebrow="Agenda"
            title="Próximos prazos"
            icon={CalendarDays}
            description="Nenhum prazo próximo cadastrado para seus projetos."
            actionLabel="Abrir agenda"
            onAction={() => handleNavigate("/app/deadlines")}
          />
          <EmptySideCard
            eyebrow="Atualizações"
            title="Atividade recente"
            icon={Activity}
            description="Nenhuma atividade recente disponível para exibição."
            actionLabel="Ver notificações"
            onAction={() => handleNavigate("/app/notifications")}
          />
        </aside>
      </div>
    </motion.div>
  );
}
