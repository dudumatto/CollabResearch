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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientadorDashboard } from "../utils/adapters";
import { formatProjectStatus, formatApplicationStatus, formatEntregaStatus, formatEtapaStatus } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { WelcomeBanner } from "../components/WelcomeBanner";
import "./AdvisorWorkspace.css";

const DASHBOARD_PREVIEW_LIMIT = 2;

const Sk = ({ w = "100%", h = 14, r = "0.5rem", mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined }} />
);


function AdvisorDashboardSkeleton() {
  return (
    <div className="advisor-pagina">
      <Sk w="100%" h={128} r="var(--raio-grande)" mb={16} />
      <div className="advisor-dashboard-overview">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="advisor-metrica advisor-metrica--overview advisor-metrica--normal">
            <Sk w={34} h={34} r="var(--raio-medio)" />
            <div style={{ flex: 1 }}>
              <Sk w={28} h={22} mb={6} />
              <Sk w="70%" h={12} />
            </div>
          </div>
        ))}
      </div>
      <div className="advisor-dashboard-layout">
        <div className="advisor-grade-filas advisor-grade-filas--prioridade">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="advisor-card">
              <div className="advisor-card__cabecalho">
                <Sk w={140} h={15} />
                <Sk w={24} h={24} r="var(--raio-completo)" />
              </div>
              <div className="advisor-card__corpo">
                <Sk w="100%" h={46} r="var(--raio-medio)" />
              </div>
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
  if (kind === "etapa") return formatEtapaStatus(status);
  return status ?? "";
}

function statusClassFor(status, kind) {
  if (kind === "project") {
    if (status === "ABERTO") return "advisor-fila-item__status--verde";
    if (status === "EM_ANDAMENTO") return "advisor-fila-item__status--amarelo";
    if (status === "FINALIZADO") return "advisor-fila-item__status--vermelho";
  }

  if (kind === "etapa") {
    if (status === "PENDING") return "advisor-fila-item__status--verde";
    if (status === "ACTIVE") return "advisor-fila-item__status--amarelo";
    if (status === "DONE" || status === "REJECTED") return "advisor-fila-item__status--vermelho";
  }

  return "";
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

function QueueCard({ title, icon: Icon, items, kind, onNavigate }) {
  const visibleItems = items.slice(0, DASHBOARD_PREVIEW_LIMIT);

  return (
    <div className={`advisor-card advisor-card--${kind} ${items.length === 0 ? "advisor-card--sem-itens" : ""}`}>
      <div className="advisor-card__cabecalho">
        <span className="advisor-card__titulo">{title}</span>
        <span className="advisor-card__contador">{items.length}</span>
      </div>
      <div className="advisor-card__corpo">
        {items.length === 0 ? (
          <div className="advisor-card__vazio">
            <CheckCircle2 size={17} />
            <span>Nada pendente por aqui.</span>
          </div>
        ) : (
          visibleItems.map((item, index) => (
            <motion.button
              key={`${item.id}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              onClick={() => item.destino && onNavigate(item.destino)}
              className="advisor-fila-item"
            >
              <div className="advisor-fila-item__icone">
                <Icon size={14} />
              </div>
              <div className="advisor-fila-item__info">
                <p className="advisor-fila-item__titulo">{item.titulo}</p>
                {item.subtitulo && <p className="advisor-fila-item__subtitulo">{item.subtitulo}</p>}
              </div>
              {item.status && (
                <span className={`advisor-fila-item__status ${statusClassFor(item.status, kind)}`}>
                  {statusLabelFor(item.status, kind)}
                </span>
              )}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

function AdvisorSection({ title, description, children }) {
  return (
    <section className="advisor-dashboard-section">
      <div className="advisor-dashboard-section__cabecalho">
        <div>
          <h3 className="advisor-dashboard-section__titulo">{title}</h3>
          {description && <p className="advisor-dashboard-section__descricao">{description}</p>}
        </div>
      </div>
      {children}
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
        {metricCards.map((card, index) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.025 }}
            onClick={() => handleNavigate(card.href)}
            className={`advisor-metrica advisor-metrica--overview advisor-metrica--${card.priority}`}
          >
            <div className={`advisor-metrica__icone-area ${card.areaClass}`}>
              <card.icon size={16} className={card.iconClass} />
            </div>
            <div className="advisor-metrica__conteudo">
              <p className="advisor-metrica__valor">{card.value}</p>
              <p className="advisor-metrica__rotulo">{card.label}</p>
            </div>
            <ChevronRight size={14} className="advisor-metrica__seta" />
          </motion.button>
        ))}
      </div>

      <div className="advisor-dashboard-layout">
        <div className="advisor-dashboard-principal">
          <AdvisorSection title="Prioridades" description="Pendências que bloqueiam inscrição, entrega ou avanço.">
            <div className="advisor-grade-filas advisor-grade-filas--prioridade">
              {highPriorityQueues.map((config) => (
                <QueueCard
                  key={config.key}
                  title={config.title}
                  icon={config.icon}
                  kind={config.kind}
                  items={filas[config.key] ?? []}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </AdvisorSection>

          <AdvisorSection title="Acompanhamento" description="Projetos, orientandos e avaliações em andamento.">
            <div className="advisor-grade-filas advisor-grade-filas--acompanhamento">
              {followUpQueues.map((config) => (
                <QueueCard
                  key={config.key}
                  title={config.title}
                  icon={config.icon}
                  kind={config.kind}
                  items={filas[config.key] ?? []}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </AdvisorSection>
        </div>
      </div>
    </motion.div>
  );
}
