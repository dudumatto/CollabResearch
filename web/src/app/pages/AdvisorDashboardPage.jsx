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
    },
    {
      label: "Solicitações de orientação",
      value: metricas.solicitacoesOrientacao,
      icon: FileText,
      areaClass: "advisor-metrica__icone-area--violeta",
      iconClass: "advisor-metrica__icone--violeta",
      href: "/app/projects",
    },
    {
      label: "Inscrições aguardando análise",
      value: metricas.inscricoesPendentes,
      icon: Users,
      areaClass: "advisor-metrica__icone-area--laranja",
      iconClass: "advisor-metrica__icone--laranja",
      href: "/app/applications",
    },
    {
      label: "Orientandos ativos",
      value: metricas.orientandosAtivos,
      icon: GraduationCap,
      areaClass: "advisor-metrica__icone-area--verde",
      iconClass: "advisor-metrica__icone--verde",
      href: "/app/advisees",
    },
    {
      label: "Etapas atrasadas",
      value: metricas.etapasAtrasadas,
      icon: AlertTriangle,
      areaClass: "advisor-metrica__icone-area--erro",
      iconClass: "advisor-metrica__icone--erro",
      href: "/app/progress",
    },
    {
      label: "Entregas aguardando revisão",
      value: metricas.entregasAguardandoRevisao,
      icon: ClipboardCheck,
      areaClass: "advisor-metrica__icone-area--laranja",
      iconClass: "advisor-metrica__icone--laranja",
      href: "/app/deliveries",
    },
    {
      label: "Avaliações aguardando ciência",
      value: metricas.avaliacoesAguardandoCiencia,
      icon: Star,
      areaClass: "advisor-metrica__icone-area--violeta",
      iconClass: "advisor-metrica__icone--violeta",
      href: "/app/avaliacoes",
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
            <CheckCircle2 size={18} style={{ marginBottom: 6 }} />
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

  const handleNavigate = (destino) => navigate(destino);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero">
        <div className="advisor-hero__conteudo">
          <p className="painel__data-banner" style={{ color: "rgba(226,232,240,0.78)" }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="advisor-hero__titulo">
            Olá, {user?.nome?.split(" ")[0] ?? "professor(a)"}!
          </h2>
          <p className="advisor-hero__subtitulo">
            Você tem <strong>{metricas.inscricoesPendentes} inscrições</strong> aguardando análise,{" "}
            <strong>{metricas.entregasAguardandoRevisao} entregas</strong> para revisar e{" "}
            <strong>{metricas.etapasAtrasadas} etapas atrasadas</strong>.
          </p>
        </div>
      </div>

      <div className="advisor-grade-metricas">
        {metricCards.map((card, index) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ scale: 1.03, boxShadow: "0 16px 30px rgba(31,122,90,0.16)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNavigate(card.href)}
            className="advisor-metrica"
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

      <div className="advisor-grade-filas">
        {filasConfig.map((config) => (
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
    </motion.div>
  );
}
