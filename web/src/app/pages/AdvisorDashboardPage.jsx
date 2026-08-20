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
import { WelcomeBanner } from "../components/WelcomeBanner";
import "./AdvisorWorkspace.css";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined }} />
);

function AdvisorDashboardSkeleton() {
  return (
    <div className="advisor-pagina">
      <Sk w="100%" h={132} r="var(--raio-grande)" mb={20} />
      <div className="advisor-grade-metricas">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", padding: "var(--espaco-5)", border: "1px solid var(--cor-borda-clara)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--espaco-4)" }}>
              <Sk w={36} h={36} r="var(--raio-medio)" />
              <Sk w={14} h={14} />
            </div>
            <Sk w="40%" h={26} mb={8} />
            <Sk w="65%" h={13} />
          </div>
        ))}
      </div>
      <div className="advisor-grade-filas">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", overflow: "hidden" }}>
            <div style={{ padding: "var(--espaco-4)", borderBottom: "1px solid var(--cor-fundo)" }}>
              <Sk w={130} h={15} />
            </div>
            <div style={{ padding: "0 var(--espaco-4)" }}>
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--cor-borda-clara)" }}>
                  <Sk w={28} h={28} r="var(--raio-pequeno)" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <Sk w="60%" h={13} />
                    <Sk w="40%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
    {
      label: "Avaliações aguardando ciência",
      value: metricas.avaliacoesAguardandoCiencia,
      icon: Star,
      areaClass: "advisor-metrica__icone-area--violeta",
      iconClass: "advisor-metrica__icone--violeta",
      href: "/app/avaliacoes",
      priority: "normal",
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
    <div className="advisor-card">
      <div className="advisor-card__cabecalho">
        <span className="advisor-card__titulo">{title}</span>
        <span className="advisor-card__contador">{items.length}</span>
      </div>
      <div className="advisor-card__corpo">
        {items.length === 0 ? (
          <div className="advisor-card__vazio">
            <CheckCircle2 size={18} />
            <div>Nada pendente por aqui.</div>
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
  const highPriorityQueues = filasConfig.filter((config) =>
    ["inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );
  const followUpQueues = filasConfig.filter((config) =>
    !["inscricoesPendentes", "entregasAguardandoRevisao", "etapasAtrasadas"].includes(config.key),
  );

  const handleNavigate = (destino) => navigate(destino);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <WelcomeBanner
        name={user?.nome?.split(" ")[0] ?? "professor(a)"}
        summary={<>
          Você tem <strong>{metricas.inscricoesPendentes} inscrições</strong> aguardando análise, <strong>{metricas.entregasAguardandoRevisao} entregas</strong> para revisar e <strong>{metricas.etapasAtrasadas} etapas atrasadas</strong>.
        </>}
        primaryAction={{ label: "Ver inscrições", onClick: () => handleNavigate("/app/applications") }}
        secondaryAction={{ label: "Ver progresso", onClick: () => handleNavigate("/app/progress") }}
      />

      <AdvisorSection title="Atenção do dia" description="Itens que tendem a bloquear alunos ou etapas do projeto.">
        <div className="advisor-grade-metricas advisor-grade-metricas--prioridade">
          {actionMetricCards.map((card, index) => (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={{ scale: 1.02, boxShadow: "0 16px 30px rgba(31,122,90,0.16)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(card.href)}
              className={`advisor-metrica advisor-metrica--${card.priority}`}
            >
              <div className="advisor-metrica__cabecalho">
                <div className={`advisor-metrica__icone-area ${card.areaClass}`}>
                  <card.icon size={18} className={card.iconClass} />
                </div>
                <ChevronRight size={14} className="advisor-metrica__seta" />
              </div>
              <p className="advisor-metrica__valor">{card.value}</p>
              <p className="advisor-metrica__rotulo">{card.label}</p>
            </motion.button>
          ))}
        </div>
      </AdvisorSection>

      <div className="advisor-dashboard-layout">
        <AdvisorSection title="Filas prioritárias" description="Revise primeiro inscrições, entregas e atrasos.">
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

        <aside className="advisor-dashboard-lateral">
          <AdvisorSection title="Resumo da carteira">
            <div className="advisor-grade-metricas advisor-grade-metricas--resumo">
              {overviewMetricCards.map((card) => (
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

      <AdvisorSection title="Acompanhamento" description="Visão geral para manter projetos, orientandos e avaliações em dia.">
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
    </motion.div>
  );
}
