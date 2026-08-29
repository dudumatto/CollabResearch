import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Bell,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { notificationService } from "../services/notificationService";
import { StatusView } from "../components/StatusView";
import { WelcomeBanner } from "../components/WelcomeBanner";
import {
  getProjectSlotsUsage,
  mapApplication,
  mapNotification,
  mapProject,
} from "../utils/adapters";
import { formatApplicationStatus, formatProjectStatus } from "../utils/formatters";
import "./DashboardPage.css";

const DASHBOARD_PREVIEW_LIMIT = 2;

function buildActivityData(projects, applications) {
  const entries = [...projects, ...applications]
    .map((item) => item.createdAt ?? item.appliedAt ?? item.updatedAt)
    .filter(Boolean)
    .map((date) =>
      new Date(date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    );

  const grouped = entries.reduce((acc, month) => {
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([month, atividade]) => ({ month, atividade }));
}

const Sk = ({ w = "100%", h = 14, r = "0.5rem", mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined }} />
);

function CardRow({ lines = 2 }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--cor-borda-clara)" }}>
      <Sk w={32} h={32} r="var(--raio-pequeno)" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <Sk w="60%" h={13} />
        {lines > 1 && <Sk w="40%" h={11} />}
      </div>
      <Sk w={60} h={22} r="var(--raio-completo)" />
    </div>
  );
}

function InnerCard({ rows = DASHBOARD_PREVIEW_LIMIT, titleW = 120 }) {
  return (
    <div style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", overflow: "hidden" }}>
      <div style={{ padding: "var(--espaco-4)", borderBottom: "1px solid var(--cor-borda-clara)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Sk w={titleW} h={15} />
        <Sk w={75} h={13} />
      </div>
      <div style={{ padding: "0 var(--espaco-4)" }}>
        {Array.from({ length: rows }).map((_, i) => <CardRow key={i} />)}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="painel">
      <Sk w="100%" h={176} r="var(--raio-grande)" mb={24} />
      <div className="painel__grade-resumos">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", padding: "var(--espaco-5)", border: "1px solid var(--cor-borda-clara)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--espaco-4)" }}>
              <Sk w={40} h={40} r="var(--raio-medio)" />
              <Sk w={14} h={14} />
            </div>
            <Sk w="45%" h={28} mb={8} />
            <Sk w="65%" h={13} />
          </div>
        ))}
      </div>
      <div className="painel__grade-principal" style={{ marginTop: "var(--espaco-6)" }}>
        <div className="painel__coluna-esquerda">
          <InnerCard rows={DASHBOARD_PREVIEW_LIMIT} titleW={130} />
          <InnerCard rows={DASHBOARD_PREVIEW_LIMIT} titleW={115} />
          <div style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--espaco-4)" }}>
              <Sk w={130} h={15} />
              <Sk w={75} h={13} />
            </div>
            <Sk w="100%" h={120} r="var(--raio-medio)" />
          </div>
        </div>
        <div className="painel__coluna-direita">
          <InnerCard rows={DASHBOARD_PREVIEW_LIMIT} titleW={140} />
          <InnerCard rows={DASHBOARD_PREVIEW_LIMIT} titleW={110} />
        </div>
      </div>
    </div>
  );
}

const statusClassMap = {
  APROVADO: "inscricao-item__status--aprovado",
  PENDENTE: "inscricao-item__status--pendente",
  REJEITADO: "inscricao-item__status--rejeitado",
};

const projectStatusClassMap = {
  ABERTO: "inscricao-item__status--aberto",
  EM_ANDAMENTO: "inscricao-item__status--andamento",
  FINALIZADO: "inscricao-item__status--finalizado",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error, reload, setData } = useAsyncData(async () => {
    const [projects, applications, notifications] = await Promise.all([
      projectService.list(),
      applicationService.listMine().catch(() => []),
      notificationService.listMine().catch(() => []),
    ]);

    const mappedProjects = Array.isArray(projects) ? projects.map(mapProject) : [];

    return {
      projects: mappedProjects,
      applications: Array.isArray(applications) ? applications.map(mapApplication) : [],
      notifications: Array.isArray(notifications) ? notifications.map(mapNotification) : [],
    };
  }, [], { initialData: { projects: [], applications: [], notifications: [] } });

  useEffect(() => {
    const syncNotifications = () => {
      notificationService.listMine()
        .then((items) => {
          setData((current) => ({
            ...(current ?? { projects: [], applications: [] }),
            notifications: Array.isArray(items) ? items.map(mapNotification) : [],
          }));
        })
        .catch(() => reload());
    };

    window.addEventListener("notificationsUpdated", syncNotifications);
    window.addEventListener("notifications-updated", syncNotifications);
    return () => {
      window.removeEventListener("notificationsUpdated", syncNotifications);
      window.removeEventListener("notifications-updated", syncNotifications);
    };
  }, [reload, setData]);

  const derived = useMemo(() => {
    const projects = data?.projects ?? [];
    const applications = data?.applications ?? [];
    const notifications = data?.notifications ?? [];

    const activeProjects = user?.tipo === "ORIENTADOR"
      ? projects.filter((item) => Number(item.advisorId) === Number(user.id) && item.status !== "FINALIZADO").length
      : applications.filter((item) => item.status === "APROVADO" && item.project?.status !== "FINALIZADO").length;
    const unreadNotifications = notifications.filter((item) => !item.read).length;
    const recentProjects = projects.slice(0, DASHBOARD_PREVIEW_LIMIT);
    const recentApplications = applications.slice(0, DASHBOARD_PREVIEW_LIMIT);
    const recentNotifications = notifications.slice(0, DASHBOARD_PREVIEW_LIMIT);
    const activityData = buildActivityData(projects, applications);
    const totalActivity = activityData.reduce((acc, item) => acc + item.atividade, 0);
    const activityPeak = Math.max(1, ...activityData.map((item) => item.atividade));

    return {
      activeProjects,
      recentProjects,
      recentApplications,
      recentNotifications,
      unreadNotifications,
      activityData,
      activityPeak,
      totalActivity,
    };
  }, [data, user?.id, user?.tipo]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return <StatusView title="Falha ao carregar" description={error.message} />;
  }

  const statCards = [
    {
      label: "Projetos ativos",
      value: derived.activeProjects,
      icon: FolderOpen,
      areaClass: "cartao-resumo__icone-area--azul",
      iconClass: "cartao-resumo__icone--azul",
      href: "/app/projects",
    },
    {
      label: "Inscrições",
      value: derived.recentApplications.length,
      icon: FileText,
      areaClass: "cartao-resumo__icone-area--violeta",
      iconClass: "cartao-resumo__icone--violeta",
      href: "/app/applications",
    },
    {
      label: "Notificações",
      value: derived.unreadNotifications,
      icon: Bell,
      areaClass: "cartao-resumo__icone-area--laranja",
      iconClass: "cartao-resumo__icone--laranja",
      href: "/app/notifications",
    },
    {
      label: "Atualizações",
      value: derived.totalActivity,
      icon: TrendingUp,
      areaClass: "cartao-resumo__icone-area--verde",
      iconClass: "cartao-resumo__icone--verde",
      href: "/app/progress",
      variant: "progress",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="painel"
      >
        <WelcomeBanner
          name={user?.nome?.split(" ")[0] ?? "pesquisador"}
          avatarUrl={user?.fotoPerfilUrl ?? user?.avatarUrl}
          summary={<>
            Você tem <strong>{derived.unreadNotifications} notificações</strong> pendentes e <strong>{derived.recentApplications.length} inscrições</strong> vinculadas ao seu perfil.
          </>}
          primaryAction={{ label: "Buscar projetos", onClick: () => navigate("/app/projects") }}
          secondaryAction={{ label: "Ver progresso", onClick: () => navigate("/app/progress") }}
        />

        {/* Grade de cartões de resumo */}
        <div className="painel__grade-resumos">
          {statCards.map((card) => (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(card.href)}
              className={`cartao-resumo ${card.variant === "progress" ? "cartao-resumo--progresso" : ""}`}
            >
              <div className="cartao-resumo__cabecalho">
                <div className={`cartao-resumo__icone-area ${card.areaClass}`}>
                  <card.icon size={16} className={card.iconClass} />
                </div>
                <ChevronRight size={14} className="cartao-resumo__seta" />
              </div>
              <p className="cartao-resumo__valor">{card.value}</p>
              <p className="cartao-resumo__descricao">{card.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Grade principal */}
        <div className="painel__grade-principal">
          <div className="painel__coluna-esquerda">
            <div className="painel__card painel__card--recentes">
              <div className="painel__card-cabecalho">
                <h3 className="painel__card-titulo">Projetos recentes</h3>
                <button onClick={() => navigate("/app/projects")} className="painel__link-ver-mais">
                  Ver detalhes <ArrowRight size={13} />
                </button>
              </div>
              <div className="projeto-andamento__corpo">
                {derived.recentProjects.length === 0 ? (
                  <StatusView title="Nenhum projeto encontrado" description="A API ainda não retornou projetos para exibir aqui." />
                ) : (
                  derived.recentProjects.map((project) => (
                    <div key={project.id} className="inscricao-item">
                      <div className="inscricao-item__icone-area">
                        <FolderOpen size={15} style={{ color: "var(--cor-texto-fraco)" }} />
                      </div>
                      <div className="inscricao-item__info">
                        <p className="inscricao-item__titulo">{project.title}</p>
                        <p className="inscricao-item__orientador">{project.advisor?.name ?? "Sem orientador"}</p>
                      </div>
                      <span className={`inscricao-item__status ${projectStatusClassMap[project.status] ?? "inscricao-item__status--pendente"}`}>
                        {formatProjectStatus(project.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="painel__card painel__card--inscricoes">
              <div className="painel__card-cabecalho">
                <h3 className="painel__card-titulo">Minhas inscrições</h3>
                <button onClick={() => navigate("/app/applications")} className="painel__link-ver-mais">
                  Ver todas <ArrowRight size={13} />
                </button>
              </div>
              <div>
                {derived.recentApplications.length === 0 ? (
                  <StatusView title="Sem inscrições" description="Quando você se candidatar a projetos, elas aparecerão aqui." />
                ) : (
                  derived.recentApplications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      className="inscricao-item"
                    >
                      <div className="inscricao-item__icone-area">
                        <FileText size={15} style={{ color: "var(--cor-texto-fraco)" }} />
                      </div>
                      <div className="inscricao-item__info">
                        <p className="inscricao-item__titulo">{application.project?.title ?? "Projeto"}</p>
                        <p className="inscricao-item__orientador">{application.project?.advisor?.name ?? "Sem orientador"}</p>
                      </div>
                      <span className={`inscricao-item__status ${statusClassMap[application.status] ?? "inscricao-item__status--pendente"}`}>
                        {formatApplicationStatus(application.status)}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="painel__coluna-direita">
            <div className="painel__card painel__card--sugeridos painel__card-projetos-sugeridos">
              <div className="painel__card-cabecalho">
                <h3 className="painel__card-titulo">Projetos sugeridos</h3>
                <button onClick={() => navigate("/app/projects")} className="painel__link-ver-mais">
                  Ver todos <ArrowRight size={12} />
                </button>
              </div>
              <div className="painel__card-lista">
                {derived.recentProjects.map((project, index) => {
                  const slots = getProjectSlotsUsage(project);
                  return (
                    <motion.button
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      onClick={() => navigate(`/app/projects/${project.id}`)}
                      className="projeto-sugerido"
                    >
                      <div className="projeto-sugerido__linha">
                        <div className="projeto-sugerido__icone-area">
                          <FolderOpen size={14} style={{ color: "var(--cor-primaria)" }} />
                        </div>
                        <div className="projeto-sugerido__info">
                          <p className="projeto-sugerido__titulo">{project.title}</p>
                          <div className="projeto-sugerido__metadados">
                            <span className="projeto-sugerido__indicador-vaga" />
                            <span className="projeto-sugerido__vagas">{slots.remaining} vagas</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="painel__card painel__card--notificacoes">
              <div className="painel__card-cabecalho">
                <h3 className="painel__card-titulo">Notificações</h3>
                <button onClick={() => navigate("/app/notifications")} className="painel__link-ver-mais">
                  Ver todas <ArrowRight size={12} />
                </button>
              </div>
              <div>
                {derived.recentNotifications.length === 0 ? (
                  <StatusView title="Sem notificações" description="As notificações do sistema aparecerão aqui." />
                ) : (
                  derived.recentNotifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className={`notificacao-resumo ${!notif.read ? "notificacao-resumo--nao-lida" : ""}`}
                    >
                      <div className="notificacao-resumo__icone-area notificacao-resumo__icone-area--info">
                        <Bell size={14} style={{ color: "var(--cor-primaria)" }} />
                      </div>
                      <div className="notificacao-resumo__info">
                        <p className={`notificacao-resumo__titulo ${!notif.read ? "notificacao-resumo__titulo--nao-lida" : ""}`}>
                          {notif.title}
                        </p>
                        <p className="notificacao-resumo__data">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("pt-BR") : "-"}
                        </p>
                      </div>
                      {!notif.read && <div className="notificacao-resumo__ponto-nao-lido" />}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
