import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Bell,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Search,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { notificationService } from "../services/notificationService";
import { StatusView } from "../components/StatusView";
import { SearchModal } from "../components/SearchModal";
import {
  getProjectSeatHolders,
  getProjectSlotsUsage,
  mapApplication,
  mapNotification,
  mapProject,
} from "../utils/adapters";
import { formatApplicationStatus, formatProjectStatus } from "../utils/formatters";
import "./DashboardPage.css";

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

function InnerCard({ rows = 3, titleW = 120 }) {
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
          <InnerCard rows={3} titleW={130} />
          <InnerCard rows={4} titleW={115} />
          <div style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--espaco-4)" }}>
              <Sk w={130} h={15} />
              <Sk w={75} h={13} />
            </div>
            <Sk w="100%" h={120} r="var(--raio-medio)" />
          </div>
        </div>
        <div className="painel__coluna-direita">
          <InnerCard rows={3} titleW={140} />
          <InnerCard rows={4} titleW={110} />
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Fecha ao clicar fora da barra de pesquisa inline (não do modal)
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        // noop — pesquisa inline não tem dropdown; modal fecha pelo próprio overlay
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { data, loading, error } = useAsyncData(async () => {
    const [projects, applications, notifications] = await Promise.all([
      projectService.list(),
      applicationService.listMine().catch(() => []),
      notificationService.listMine().catch(() => []),
    ]);

    const mappedProjects = Array.isArray(projects) ? projects.map(mapProject) : [];
    const projectsWithSlots = await Promise.all(
      mappedProjects.map(async (project) => {
        const collaborators = await projectService.getCollaborators(project.id).catch(() => null);
        if (!Array.isArray(collaborators)) return project;
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

    return {
      projects: projectsWithSlots,
      applications: Array.isArray(applications) ? applications.map(mapApplication) : [],
      notifications: Array.isArray(notifications) ? notifications.map(mapNotification) : [],
    };
  }, [], { initialData: { projects: [], applications: [], notifications: [] } });

  const derived = useMemo(() => {
    const projects = data?.projects ?? [];
    const applications = data?.applications ?? [];
    const notifications = data?.notifications ?? [];

    const activeProjects = user?.tipo === "ORIENTADOR"
      ? projects.filter((item) => Number(item.advisorId) === Number(user.id) && item.status !== "FINALIZADO").length
      : applications.filter((item) => item.status === "APROVADO" && item.project?.status !== "FINALIZADO").length;
    const unreadNotifications = notifications.filter((item) => !item.read).length;
    const recentProjects = projects.slice(0, 3);
    const recentApplications = applications.slice(0, 4);
    const recentNotifications = notifications.slice(0, 4);
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
      bordaClass: "cartao-resumo--borda-azul",
      href: "/app/projects",
    },
    {
      label: "Inscrições",
      value: derived.recentApplications.length,
      icon: FileText,
      areaClass: "cartao-resumo__icone-area--violeta",
      iconClass: "cartao-resumo__icone--violeta",
      bordaClass: "cartao-resumo--borda-violeta",
      href: "/app/applications",
    },
    {
      label: "Notificações",
      value: derived.unreadNotifications,
      icon: Bell,
      areaClass: "cartao-resumo__icone-area--laranja",
      iconClass: "cartao-resumo__icone--laranja",
      bordaClass: "cartao-resumo--borda-laranja",
      href: "/app/notifications",
    },
    {
      label: "Atualizações",
      value: derived.totalActivity,
      icon: TrendingUp,
      areaClass: "cartao-resumo__icone-area--verde",
      iconClass: "cartao-resumo__icone--verde",
      bordaClass: "cartao-resumo--borda-verde",
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
        {/* Banner de boas-vindas */}
        <div className="painel__banner-boas-vindas">
          <div className="painel__decoracao-banner">
            <div className="painel__decoracao-circulo-topo" />
            <div className="painel__decoracao-circulo-base" />
          </div>
          <div className="painel__conteudo-banner">
            <p className="painel__data-banner">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h2 className="painel__titulo-banner">
              <span className="painel__titulo-destaque">Olá, {user?.nome?.split(" ")[0] ?? "pesquisador"}!</span>
            </h2>
            <p className="painel__descricao-banner">
              Você tem <strong className="painel__destaque-banner">{derived.unreadNotifications} notificações</strong> pendentes
              e <strong className="painel__destaque-banner"> {derived.recentApplications.length} inscrições</strong> vinculadas ao seu perfil.
            </p>
            <div className="painel__botoes-banner">
              <button
                onClick={() => navigate("/app/projects")}
                className="painel__botao-banner painel__botao-banner--primario"
              >
                <FolderOpen size={14} /> Buscar projetos
              </button>
              <button
                onClick={() => navigate("/app/progress")}
                className="painel__botao-banner painel__botao-banner--secundario"
              >
                <TrendingUp size={14} /> Ver progresso
              </button>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa — visível apenas em mobile/tablet */}
        <div className="painel__barra-pesquisa" ref={searchRef}>
          <button
            className="painel__campo-pesquisa"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} className="painel__icone-pesquisa" />
            <span className="painel__pesquisa-placeholder">Buscar projetos, usuários...</span>
            <span className="painel__pesquisa-atalho">CRTL+K</span>
          </button>
        </div>

        {/* Grade de cartões de resumo */}
        <div className="painel__grade-resumos">
          {statCards.map((card) => (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.03, boxShadow: "0 16px 30px rgba(37,99,235,0.18)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(card.href)}
              className={`cartao-resumo ${card.bordaClass} ${card.variant === "progress" ? "cartao-resumo--progresso" : ""}`}
            >
              <div className="cartao-resumo__cabecalho">
                <div className={`cartao-resumo__icone-area ${card.areaClass}`}>
                  <card.icon size={18} className={card.iconClass} />
                </div>
                <ChevronRight size={14} className="cartao-resumo__seta" />
              </div>
              <p className="cartao-resumo__valor">{card.value}</p>
              <p className="cartao-resumo__descricao">{card.label}</p>
              {card.variant === "progress" ? (
                <div className="cartao-resumo__progresso-extra">
                  <div className="cartao-resumo__mini-barras" aria-hidden="true">
                    {(derived.activityData.length ? derived.activityData.slice(-5) : [{ month: "-", atividade: 0 }]).map((item, index) => (
                      <span
                        key={`${item.month}-${index}`}
                        style={{ height: `${Math.max(18, (item.atividade / derived.activityPeak) * 100)}%` }}
                      />
                    ))}
                  </div>
                  <span className="cartao-resumo__progresso-cta">Abrir progresso</span>
                </div>
              ) : null}
            </motion.button>
          ))}
        </div>

        {/* Grade principal */}
        <div className="painel__grade-principal">
          <div className="painel__coluna-esquerda">
            <div className="painel__card">
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
                      <span className="inscricao-item__status inscricao-item__status--pendente">
                        {formatProjectStatus(project.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="painel__card">
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

            <div className="painel__card-grafico">
              <div className="painel__grafico-cabecalho">
                <h3 className="painel__card-titulo">Atividade recente</h3>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={derived.activityData}>
                  <defs>
                    <linearGradient id="colorAtiv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f7a5a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1f7a5a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: "0.8rem" }}
                    labelStyle={{ fontWeight: 600, color: "#374151" }}
                  />
                  <Area type="monotone" dataKey="atividade" stroke="#1f7a5a" strokeWidth={2} fill="url(#colorAtiv)" dot={{ fill: "#1f7a5a", strokeWidth: 2, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="painel__coluna-direita">
            <div className="painel__card painel__card-projetos-sugeridos">
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
                      whileHover={{ scale: 1.03, boxShadow: "0 10px 24px rgba(37,99,235,0.12)" }}
                      whileTap={{ scale: 0.97 }}
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

            <div className="painel__card">
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

      {/* Modal de pesquisa — fecha ao clicar no overlay (mousedown + touchstart no próprio SearchModal) */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
