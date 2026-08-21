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
import { formatProjectStatus, formatApplicationStatus, formatEntregaStatus } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined }} />
);

function AdvisorDashboardSkeleton() {
  return (
    <div className="advisor-pagina">
      <Sk w="100%" h={128} r="var(--raio-grande)" mb={16} />
      <div className="advisor-dashboard-overview">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="advisor-metrica advisor-metrica--overview">
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
        <div className="advisor-dashboard-lateral">
          <Sk w="100%" h={150} r="var(--raio-grande)" />
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

function QueueCard({ title, icon: Icon, items, kind, onNavigate }) {
  return (
    <div className={`advisor-card ${items.length === 0 ? "advisor-card--sem-itens" : ""}`}>
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
          items.map((item, index) => (
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
                <span className="advisor-fila-item__status">{statusLabelFor(item.status, kind)}</span>
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

function DashboardHero({ name, metricas, onNavigate }) {
  const pendingTotal =
    (metricas.solicitacoesOrientacao ?? 0) +
    (metricas.inscricoesPendentes ?? 0) +
    (metricas.entregasAguardandoRevisao ?? 0) +
    (metricas.etapasAtrasadas ?? 0);

  return (
    <section className="advisor-dashboard-hero">
      <div className="advisor-dashboard-hero__texto">
        <span className="advisor-dashboard-hero__eyebrow">Painel do orientador</span>
        <h2 className="advisor-dashboard-hero__titulo">Olá, {name}.</h2>
        <p className="advisor-dashboard-hero__descricao">
          {pendingTotal > 0
            ? `${pendingTotal} pontos precisam de atenção antes de seguir a rotina.`
            : "Nenhuma pendência crítica no momento."}
        </p>
      </div>

      <div className="advisor-dashboard-hero__acoes">
        <button type="button" onClick={() => onNavigate("/app/applications")}>
          <Users size={15} /> Inscrições
        </button>
        <button type="button" onClick={() => onNavigate("/app/deliveries")}>
          <ClipboardCheck size={15} /> Entregas
        </button>
        <button type="button" onClick={() => onNavigate("/app/progress")}>
          <AlertTriangle size={15} /> Progresso
        </button>
      </div>
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
  const actionMetricCards = metricCards.filter((card) => card.priority === "action" || card.priority === "risk");
  const overviewMetricCards = metricCards.filter((card) => card.priority === "normal");
  const walletMetricCards = [
    ...overviewMetricCards,
    {
      label: "Avaliações aguardando ciência",
      value: metricas.avaliacoesAguardandoCiencia,
      icon: Star,
      areaClass: "advisor-metrica__icone-area--violeta",
      iconClass: "advisor-metrica__icone--violeta",
      href: "/app/avaliacoes",
    },
  ];
  const highPriorityQueues = filasConfig.filter((config) =>
    ["solicitacoesOrientacao", "inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );
  const followUpQueues = filasConfig.filter((config) =>
    !["solicitacoesOrientacao", "inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );

  const handleNavigate = (destino) => navigate(destino);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <DashboardHero
        name={user?.nome?.split(" ")[0] ?? "professor(a)"}
        metricas={metricas}
        onNavigate={handleNavigate}
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

        <aside className="advisor-dashboard-lateral">
          <AdvisorSection title="Ações rápidas">
            <div className="advisor-grade-metricas advisor-grade-metricas--resumo">
              {actionMetricCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => handleNavigate(card.href)}
                  className={`advisor-metrica advisor-metrica--compacta advisor-metrica--${card.priority}`}
                >
                  <div className={`advisor-metrica__icone-area ${card.areaClass}`}>
                    <card.icon size={16} className={card.iconClass} />
                  </div>
                  <div>
                    <p className="advisor-metrica__valor">{card.value}</p>
                    <p className="advisor-metrica__rotulo">{card.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </AdvisorSection>

          <AdvisorSection title="Carteira">
            <div className="advisor-grade-metricas advisor-grade-metricas--resumo">
              {walletMetricCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => handleNavigate(card.href)}
                  className="advisor-metrica advisor-metrica--compacta"
                >
                  <div className={`advisor-metrica__icone-area ${card.areaClass}`}>
                    <card.icon size={16} className={card.iconClass} />
                  </div>
                  <div>
                    <p className="advisor-metrica__valor">{card.value}</p>
                    <p className="advisor-metrica__rotulo">{card.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </AdvisorSection>
        </aside>
      </div>
    </motion.div>
  );
}
