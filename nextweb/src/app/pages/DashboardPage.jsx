"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  Inbox,
  Search,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { notificationService } from "../services/notificationService";
import { StatusView } from "../components/StatusView";
import { SearchModal } from "../components/SearchModal";
import { Badge, Button, Card } from "../components/ui";
import {
  getProjectSeatHolders,
  getProjectSlotsUsage,
  mapApplication,
  mapNotification,
  mapProject,
} from "../utils/adapters";
import { formatApplicationStatus, formatProjectStatus } from "../utils/formatters";

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

const Sk = ({ className = "", w = "100%", h = "1rem", r = "0.75rem" }) => (
  <div
    className={`painel-skeleton ${className}`}
    style={{ "--sk-w": w, "--sk-h": h, "--sk-r": r }}
  />
);

function SkeletonList({ rows = 3 }) {
  return (
    <div className="painel-skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="painel-skeleton-row" key={index}>
          <Sk w="2.25rem" h="2.25rem" r="0.75rem" />
          <div className="painel-skeleton-row__content">
            <Sk w="68%" h="0.86rem" />
            <Sk w="44%" h="0.72rem" />
          </div>
          <Sk w="4.75rem" h="1.35rem" r="999px" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="painel painel--loading" aria-busy="true">
      <Card variant="subtle" padding="none" className="painel__banner-boas-vindas painel__banner-boas-vindas--skeleton">
        <div className="painel__conteudo-banner">
          <Sk w="8.5rem" h="1.35rem" r="999px" />
          <Sk w="min(100%, 24rem)" h="2rem" r="0.8rem" />
          <Sk w="min(100%, 38rem)" h="0.9rem" />
          <div className="painel__botoes-banner">
            <Sk w="8.75rem" h="2.4rem" r="0.75rem" />
            <Sk w="8.75rem" h="2.4rem" r="0.75rem" />
          </div>
        </div>
      </Card>

      <div className="painel__grade-resumos">
        {[1, 2, 3, 4].map((item) => (
          <div className="cartao-resumo cartao-resumo--skeleton" key={item}>
            <div className="cartao-resumo__cabecalho">
              <Sk w="2.35rem" h="2.35rem" r="0.8rem" />
              <Sk w="1rem" h="1rem" r="999px" />
            </div>
            <Sk w="42%" h="1.85rem" />
            <Sk w="70%" h="0.82rem" />
          </div>
        ))}
      </div>

      <div className="painel__grade-principal">
        <div className="painel__coluna-esquerda">
          <Card variant="default" padding="none" className="painel__card">
            <div className="painel__card-cabecalho">
              <Sk w="10rem" h="1rem" />
              <Sk w="5.5rem" h="1.4rem" r="999px" />
            </div>
            <SkeletonList rows={3} />
          </Card>
          <Card variant="default" padding="none" className="painel__card painel__card-grafico">
            <Sk w="10rem" h="1rem" />
            <Sk className="painel-skeleton-chart" w="100%" h="8.75rem" r="1rem" />
          </Card>
        </div>
        <div className="painel__coluna-direita">
          <Card variant="default" padding="none" className="painel__card">
            <div className="painel__card-cabecalho">
              <Sk w="9rem" h="1rem" />
              <Sk w="5.5rem" h="1.4rem" r="999px" />
            </div>
            <SkeletonList rows={4} />
          </Card>
          <Card variant="default" padding="none" className="painel__card">
            <div className="painel__card-cabecalho">
              <Sk w="8rem" h="1rem" />
              <Sk w="5.5rem" h="1.4rem" r="999px" />
            </div>
            <SkeletonList rows={3} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="painel-empty">
      <span className="painel-empty__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div>
        <p className="painel-empty__title">{title}</p>
        <p className="painel-empty__description">{description}</p>
      </div>
    </div>
  );
}

function PanelHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="painel__card-cabecalho">
      <div>
        <h3 className="painel__card-titulo">{title}</h3>
        {description ? <p className="painel__card-descricao">{description}</p> : null}
      </div>
      {actionLabel ? (
        <Button variant="tertiary" size="sm" className="painel__link-ver-mais" onClick={onAction} rightIcon={<ArrowRight size={13} />}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function MetricButton({ card, index, onNavigate, activityData, activityPeak }) {
  const Icon = card.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(card.href)}
      className={`cartao-resumo cartao-resumo--${card.tone} ${card.variant === "progress" ? "cartao-resumo--progresso" : ""}`}
      aria-label={`Abrir ${card.label.toLowerCase()}`}
    >
      <div className="cartao-resumo__cabecalho">
        <span className="cartao-resumo__icone-area" aria-hidden="true">
          <Icon size={18} />
        </span>
        <ChevronRight size={14} className="cartao-resumo__seta" aria-hidden="true" />
      </div>
      <p className="cartao-resumo__valor">{card.value}</p>
      <div className="cartao-resumo__texto">
        <p className="cartao-resumo__descricao">{card.label}</p>
        <span>{card.helper}</span>
      </div>
      {card.variant === "progress" ? (
        <div className="cartao-resumo__progresso-extra" aria-hidden="true">
          <div className="cartao-resumo__mini-barras">
            {(activityData.length ? activityData.slice(-5) : [{ month: "-", atividade: 0 }]).map((item, barIndex) => (
              <span
                key={`${item.month}-${barIndex}`}
                style={{ height: `${Math.max(18, (item.atividade / activityPeak) * 100)}%` }}
              />
            ))}
          </div>
          <Badge tone="success" size="sm">Abrir</Badge>
        </div>
      ) : (
        <Badge tone={card.badgeTone} size="sm">Abrir</Badge>
      )}
    </motion.button>
  );
}

const applicationToneMap = {
  APROVADO: "success",
  PENDENTE: "warning",
  REJEITADO: "danger",
};

const projectToneMap = {
  ABERTO: "success",
  EM_ANDAMENTO: "info",
  FINALIZADO: "neutral",
  PAUSADO: "warning",
  CANCELADO: "danger",
};

export default function DashboardPage() {
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Fecha ao clicar fora da barra de pesquisa inline; o modal continua fechando pelo proprio overlay.
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        // A pesquisa inline nao tem dropdown; mantemos a logica existente sem efeito colateral.
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Atalho Ctrl+K / Cmd+K.
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

  const firstName = user?.nome?.split(" ")[0] ?? "pesquisador";
  const profileLabel = user?.tipo === "ORIENTADOR" ? "Área do orientador" : "Área do aluno";

  const statCards = [
    {
      label: "Projetos ativos",
      value: derived.activeProjects,
      helper: user?.tipo === "ORIENTADOR" ? "Projetos sob sua orientação" : "Projetos aprovados em andamento",
      icon: FolderOpen,
      href: "/app/projects",
      tone: "brand",
      badgeTone: "brand",
    },
    {
      label: "Inscrições recentes",
      value: derived.recentApplications.length,
      helper: "Últimas candidaturas do seu perfil",
      icon: FileText,
      href: "/app/applications",
      tone: "info",
      badgeTone: "info",
    },
    {
      label: "Notificações não lidas",
      value: derived.unreadNotifications,
      helper: "Atualizações pendentes para revisar",
      icon: Bell,
      href: "/app/notifications",
      tone: "warning",
      badgeTone: "warning",
    },
    {
      label: "Atividade registrada",
      value: derived.totalActivity,
      helper: "Projetos e inscrições no período",
      icon: TrendingUp,
      href: "/app/progress",
      tone: "success",
      badgeTone: "success",
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
        <Card variant="highlight" padding="none" className="painel__banner-boas-vindas">
          <div className="painel__decoracao-banner" aria-hidden="true" />
          <div className="painel__conteudo-banner">
            <div className="painel__banner-meta">
              <Badge tone="brand" size="sm" icon={<CheckCircle2 size={12} />}>
                {profileLabel}
              </Badge>
              <p className="painel__data-banner">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <h2 className="painel__titulo-banner">
              Olá, <span className="painel__titulo-destaque">{firstName}</span>
            </h2>
            <p className="painel__descricao-banner">
              Você tem <strong className="painel__destaque-banner">{derived.unreadNotifications} notificações</strong> não lidas
              e <strong className="painel__destaque-banner"> {derived.recentApplications.length} inscrições</strong> vinculadas ao seu perfil.
            </p>
            <div className="painel__botoes-banner">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/app/projects")}
                leftIcon={<FolderOpen size={15} />}
              >
                Buscar projetos
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/app/progress")}
                leftIcon={<TrendingUp size={15} />}
              >
                Ver progresso
              </Button>
            </div>
          </div>
        </Card>

        <div className="painel__barra-pesquisa" ref={searchRef}>
          <button
            type="button"
            className="painel__campo-pesquisa"
            onClick={() => setSearchOpen(true)}
            aria-label="Abrir busca global"
          >
            <Search size={16} className="painel__icone-pesquisa" aria-hidden="true" />
            <span className="painel__pesquisa-placeholder">Buscar projetos, pessoas ou mensagens...</span>
            <span className="painel__pesquisa-atalho">Ctrl K</span>
          </button>
        </div>

        <section className="painel__grade-resumos" aria-label="Resumo do dashboard">
          {statCards.map((card, index) => (
            <MetricButton
              key={card.label}
              card={card}
              index={index}
              onNavigate={navigate}
              activityData={derived.activityData}
              activityPeak={derived.activityPeak}
            />
          ))}
        </section>

        <section className="painel__grade-principal" aria-label="Conteúdo principal do dashboard">
          <div className="painel__coluna-esquerda">
            <Card variant="default" padding="none" className="painel__card painel__card--principal">
              <PanelHeader
                title="Projetos recentes"
                description="Oportunidades e projetos que entraram no radar da plataforma."
                actionLabel="Ver detalhes"
                onAction={() => navigate("/app/projects")}
              />
              <div className="painel-list projeto-andamento__corpo">
                {derived.recentProjects.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="Nenhum projeto recente encontrado"
                    description="Quando novos projetos forem cadastrados, eles aparecerão neste espaço."
                  />
                ) : (
                  derived.recentProjects.map((project) => (
                    <article key={project.id} className="inscricao-item">
                      <div className="inscricao-item__icone-area" aria-hidden="true">
                        <FolderOpen size={15} />
                      </div>
                      <div className="inscricao-item__info">
                        <p className="inscricao-item__titulo">{project.title}</p>
                        <p className="inscricao-item__orientador">{project.advisor?.name ?? "Sem orientador"}</p>
                      </div>
                      <Badge tone={projectToneMap[project.status] ?? "neutral"} size="sm">
                        {formatProjectStatus(project.status)}
                      </Badge>
                    </article>
                  ))
                )}
              </div>
            </Card>

            <Card variant="default" padding="none" className="painel__card">
              <PanelHeader
                title="Minhas inscrições"
                description="Acompanhe as candidaturas mais recentes do seu perfil."
                actionLabel="Ver todas"
                onAction={() => navigate("/app/applications")}
              />
              <div className="painel-list">
                {derived.recentApplications.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Você ainda não enviou inscrições"
                    description="Quando você se candidatar a projetos, o acompanhamento aparecerá aqui."
                  />
                ) : (
                  derived.recentApplications.map((application, index) => (
                    <motion.article
                      key={application.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      className="inscricao-item"
                    >
                      <div className="inscricao-item__icone-area" aria-hidden="true">
                        <FileText size={15} />
                      </div>
                      <div className="inscricao-item__info">
                        <p className="inscricao-item__titulo">{application.project?.title ?? "Projeto"}</p>
                        <p className="inscricao-item__orientador">{application.project?.advisor?.name ?? "Sem orientador"}</p>
                      </div>
                      <Badge tone={applicationToneMap[application.status] ?? "warning"} size="sm">
                        {formatApplicationStatus(application.status)}
                      </Badge>
                    </motion.article>
                  ))
                )}
              </div>
            </Card>

            <Card variant="default" padding="none" className="painel__card painel__card-grafico">
              <PanelHeader
                title="Atividade recente"
                description="Volume agregado de projetos e inscrições por mês."
                actionLabel="Abrir progresso"
                onAction={() => navigate("/app/progress")}
              />
              {derived.activityData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Sem atividade recente"
                  description="Projetos e inscrições criados aparecerão como tendência neste painel."
                />
              ) : (
                <div className="painel__grafico-corpo">
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={derived.activityData}>
                      <defs>
                        <linearGradient id="colorAtiv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1f7a5a" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#1f7a5a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#66736a" }} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ borderRadius: "14px", border: "1px solid rgba(199, 215, 189, 0.72)", boxShadow: "0 14px 34px rgba(23,37,29,0.1)", fontSize: "0.8rem" }}
                        labelStyle={{ fontWeight: 700, color: "#17251d" }}
                      />
                      <Area type="monotone" dataKey="atividade" stroke="#1f7a5a" strokeWidth={2.5} fill="url(#colorAtiv)" dot={{ fill: "#1f7a5a", strokeWidth: 2, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="painel__coluna-direita">
            <Card variant="subtle" padding="none" className="painel__card painel__card-projetos-sugeridos">
              <PanelHeader
                title="Projetos sugeridos"
                description="Atalhos rápidos para oportunidades abertas."
                actionLabel="Ver todos"
                onAction={() => navigate("/app/projects")}
              />
              <div className="painel__card-lista">
                {derived.recentProjects.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="Sem sugestões por enquanto"
                    description="Complete seu perfil acadêmico e acompanhe novos projetos cadastrados."
                  />
                ) : (
                  derived.recentProjects.map((project, index) => {
                    const slots = getProjectSlotsUsage(project);
                    return (
                      <motion.button
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.05 }}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/app/projects/${project.id}`)}
                        className="projeto-sugerido"
                      >
                        <div className="projeto-sugerido__linha">
                          <div className="projeto-sugerido__icone-area" aria-hidden="true">
                            <FolderOpen size={14} />
                          </div>
                          <div className="projeto-sugerido__info">
                            <p className="projeto-sugerido__titulo">{project.title}</p>
                            <div className="projeto-sugerido__metadados">
                              <span className="projeto-sugerido__indicador-vaga" />
                              <span className="projeto-sugerido__vagas">{slots.remaining} vagas</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="projeto-sugerido__seta" aria-hidden="true" />
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card variant="default" padding="none" className="painel__card">
              <PanelHeader
                title="Notificações"
                description="Atualizações recentes do sistema e dos seus fluxos."
                actionLabel="Ver todas"
                onAction={() => navigate("/app/notifications")}
              />
              <div className="painel-list painel-list--notifications">
                {derived.recentNotifications.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="Tudo em dia por aqui"
                    description="Novas notificações aparecerão neste espaço assim que houver atualizações."
                  />
                ) : (
                  derived.recentNotifications.map((notif, index) => (
                    <motion.article
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className={`notificacao-resumo ${!notif.read ? "notificacao-resumo--nao-lida" : ""}`}
                    >
                      <div className="notificacao-resumo__icone-area notificacao-resumo__icone-area--info" aria-hidden="true">
                        <Bell size={14} />
                      </div>
                      <div className="notificacao-resumo__info">
                        <p className={`notificacao-resumo__titulo ${!notif.read ? "notificacao-resumo__titulo--nao-lida" : ""}`}>
                          {notif.title}
                        </p>
                        <p className="notificacao-resumo__data">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("pt-BR") : "-"}
                        </p>
                      </div>
                      {!notif.read ? <div className="notificacao-resumo__ponto-nao-lido" aria-label="Não lida" /> : null}
                    </motion.article>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </motion.div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

