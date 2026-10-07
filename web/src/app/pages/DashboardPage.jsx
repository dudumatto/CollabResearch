import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FileText, Bell, TrendUp, MagnifyingGlass, Sparkle, Users, CalendarCheck, ChatCircleText, Star } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useNotifications } from "../providers/NotificationsProvider";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { etapaService } from "../services/etapaService";
import { conversationService } from "../services/conversationService";
import { progressService } from "../services/progressService";
import { StatusView } from "../components/StatusView";
import { WelcomeBanner } from "../components/WelcomeBanner";
import {
  DashCard,
  DashMetric,
  DashRow,
  DashEmpty,
  DashAvatar,
  DashAgenda,
  DashProgress,
  DashPromo,
  DashFit,
} from "../components/DashboardKit";
import {
  mapApplication,
  mapProject,
  mapDeadlineAgenda,
  getUserId,
} from "../utils/adapters";
import { formatApplicationStatus, getInitials } from "../utils/formatters";
import "../components/DashboardKit.css";

const DASHBOARD_PREVIEW_LIMIT = 3;
const MESSAGES_PREVIEW_LIMIT = 2;
// Calendário mostra 3 prazos inteiros + o 4º cortado com fade e "Ver mais"
// (mesmo comportamento do painel do orientador, ver AdvisorDashboardPage).
const CALENDAR_PREVIEW_LIMIT = 3;

const applicationTone = {
  APROVADO: "verde",
  PENDENTE: "laranja",
  REJEITADO: "vermelho",
};

const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

function SkeletonCard({ rows = 3 }) {
  return (
    <div className="dash-card">
      <div className="dash-card__cabecalho">
        <Sk w={28} h={28} r="0.5rem" />
        <Sk w={140} h={16} />
      </div>
      <div className="dash-card__corpo" style={{ gap: "var(--espaco-4)", paddingTop: "var(--espaco-2)" }}>
        {Array.from({ length: rows }).map((_, i) => <Sk key={i} w="100%" h={30} />)}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dash" aria-busy="true" aria-label="Carregando painel">
      <Sk w="100%" h={140} r="var(--raio-grande)" />
      <div className="dash-grade">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} rows={1} />)}
      </div>
      <div className="dash-colunas">
        <div className="dash-coluna">
          <SkeletonCard />
          <div className="dash-grade" style={{ "--dash-colunas": 2 }}>
            <SkeletonCard rows={1} />
            <SkeletonCard rows={1} />
          </div>
          <SkeletonCard rows={2} />
        </div>
        <div className="dash-coluna">
          <SkeletonCard rows={5} />
          <SkeletonCard rows={2} />
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function notificationGroup(value) {
  if (!value) return "Recente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recente";
  return date.toDateString() === new Date().toDateString()
    ? "Hoje"
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const userId = getUserId(user);

  const { data, loading, error } = useAsyncData(async () => {
    const [projectPage, applications, prazos, conversas] = await Promise.all([
      projectService.listPaged({}, { page: 0, size: DASHBOARD_PREVIEW_LIMIT }),
      applicationService.listMine().catch(() => []),
      etapaService.listMine().catch(() => []),
      userId != null ? conversationService.listByUser(userId).catch(() => []) : Promise.resolve([]),
    ]);

    const mappedProjects = Array.isArray(projectPage?.content) ? projectPage.content.map(mapProject) : [];
    const mappedApplications = Array.isArray(applications) ? applications.map(mapApplication) : [];

    const activeApplication = mappedApplications.find(
      (item) => item.status === "APROVADO" && item.project?.status !== "FINALIZADO",
    );
    const activeProjectId = activeApplication?.project?.id ?? activeApplication?.projectId ?? null;

    const progress = activeProjectId != null
      ? await progressService.getProgress(activeProjectId).catch(() => null)
      : null;

    return {
      projects: mappedProjects,
      applications: mappedApplications,
      agenda: mapDeadlineAgenda(prazos),
      conversations: Array.isArray(conversas) ? conversas : [],
      progress,
    };
  }, [userId], {
    initialData: { projects: [], applications: [], agenda: [], conversations: [], progress: null },
  });

  const derived = useMemo(() => {
    const applications = data?.applications ?? [];
    const progress = data?.progress ?? null;
    const steps = Array.isArray(progress?.steps) ? progress.steps : [];
    const doneSteps = steps.filter((step) => step.status === "DONE").length;

    return {
      recentProjects: (data?.projects ?? []).slice(0, DASHBOARD_PREVIEW_LIMIT),
      recentApplications: applications.slice(0, DASHBOARD_PREVIEW_LIMIT),
      conversations: (data?.conversations ?? []).slice(0, MESSAGES_PREVIEW_LIMIT),
      agenda: data?.agenda ?? [],
      latestNotification: notifications[0] ?? null,
      unreadNotifications: notifications.filter((item) => !item.read).length,
      progress: progress
        ? { total: steps.length, done: doneSteps, percent: progress.overallPercent ?? 0 }
        : null,
    };
  }, [data, notifications]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return <StatusView title="Falha ao carregar" description={error.message} />;
  }

  const featured = derived.recentProjects[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="dash"
    >
      <DashFit>
      <WelcomeBanner
        name={user?.nome?.split(" ")[0] ?? "pesquisador"}
        role="Estudante"
        institution={user?.instituicao}
        summary={<>
          Você tem <strong>{derived.unreadNotifications} notificações</strong> pendentes e <strong>{derived.recentApplications.length} inscrições</strong> vinculadas ao seu perfil.
        </>}
        secondaryAction={{ label: "Ver progresso", icon: TrendUp, onClick: () => navigate("/app/progress") }}
        primaryAction={{ label: "Buscar projetos", icon: MagnifyingGlass, onClick: () => navigate("/app/projects") }}
      />

      <div className="dash-grade">
        <DashMetric
          icon={FileText}
          tone="azul"
          title="Inscrições"
          caption="Inscrições enviadas por você"
          value={derived.recentApplications.length}
          onOpen={() => navigate("/app/applications")}
        />

        <DashCard
          icon={Bell}
          tone="verde"
          title="Notificações recentes"
          onOpen={() => navigate("/app/notifications")}
        >
          {derived.latestNotification ? (
            <div>
              <p className="dash-notif__grupo">{notificationGroup(derived.latestNotification.createdAt)}</p>
              <p className="dash-notif__titulo">{derived.latestNotification.title}</p>
              {derived.latestNotification.message && (
                <p className="dash-notif__texto">{derived.latestNotification.message}</p>
              )}
            </div>
          ) : (
            <DashEmpty>As notificações do sistema aparecerão aqui.</DashEmpty>
          )}
        </DashCard>

        <DashCard icon={Sparkle} tone="roxo" title="Lumen AI" caption="Pergunte a IA">
          <DashPromo>
            Use gratuitamente a nova IA da plataforma para pesquisas, perguntas e muito mais.
          </DashPromo>
        </DashCard>
      </div>

      <div className="dash-colunas">
        <div className="dash-coluna">
          <DashCard
            icon={FileText}
            tone="azul"
            title="Inscrições"
            caption="Resumo das suas inscrições"
            onOpen={() => navigate("/app/applications")}
          >
            {derived.recentApplications.length === 0 ? (
              <DashEmpty>Quando você se candidatar a projetos, elas aparecerão aqui.</DashEmpty>
            ) : (
              derived.recentApplications.map((application) => {
                const projectId = application.project?.id ?? application.projectId;
                const enviada = formatShortDate(application.appliedAt);
                return (
                  <DashRow
                    key={application.id}
                    title={application.project?.title ?? "Projeto"}
                    subtitle={enviada ? `Enviada em ${enviada}` : undefined}
                    badge={formatApplicationStatus(application.status)}
                    badgeTone={applicationTone[application.status] ?? "laranja"}
                    onOpen={projectId != null ? () => navigate(`/app/projects/${projectId}`) : undefined}
                    openLabel={`Abrir projeto ${application.project?.title ?? "Projeto"}`}
                  />
                );
              })
            )}
          </DashCard>

          <div className="dash-grade" style={{ "--dash-colunas": 2 }}>
            <DashCard
              icon={TrendUp}
              tone="verde"
              title="Progresso"
              onOpen={() => navigate("/app/progress")}
            >
              {derived.progress ? (
                <DashProgress
                  status="Em andamento"
                  statusTone="verde"
                  label="Andamento do projeto"
                  done={derived.progress.done}
                  total={derived.progress.total}
                  percent={derived.progress.percent}
                />
              ) : (
                <DashEmpty>Seu progresso aparecerá quando você entrar em um projeto.</DashEmpty>
              )}
            </DashCard>

            <DashCard icon={Users} tone="roxo" title="Entregas aguardando revisão">
              <DashPromo>
                Em <strong>Comunidade</strong> você pode explorar e compartilhar novidades com outros usuários.
              </DashPromo>
            </DashCard>
          </div>

          <DashCard
            icon={Star}
            tone="laranja"
            title="Projetos recomendados para você"
            onOpen={() => navigate("/app/projects")}
          >
            {featured ? (
              <button
                type="button"
                className="dash-linha dash-linha--acionavel"
                onClick={() => navigate(`/app/projects/${featured.id}`)}
                aria-label={`Abrir projeto ${featured.title}`}
              >
                <span className="dash-destaque">
                  {featured.area && <span className="dash-destaque__area">{featured.area}</span>}
                  <span className="dash-destaque__titulo">{featured.title}</span>
                  <span className="dash-destaque__meta">
                    Orientado por {featured.advisor?.name ?? "Orientador a definir"}
                  </span>
                  <span className="dash-destaque__rodape">
                    <span className="dash-destaque__curso">{featured.courses?.[0] ?? featured.area ?? "Pesquisa"}</span>
                    <span className="dash-destaque__vagas">{featured.slotsRemaining} vagas</span>
                  </span>
                </span>
              </button>
            ) : (
              <DashEmpty>Sem recomendações por enquanto.</DashEmpty>
            )}
          </DashCard>
        </div>

        <div className="dash-coluna">
          <DashCard
            icon={CalendarCheck}
            tone="roxo"
            title="Calendário"
            caption="Veja seus próximos prazos"
            onOpen={() => navigate("/app/deadlines")}
            className="dash-card--sombra dash-card--calendario"
          >
            <div className="dash-agenda-lista">
              <DashAgenda
                items={derived.agenda.slice(0, CALENDAR_PREVIEW_LIMIT + 1)}
                emptyLabel="Nenhum prazo próximo cadastrado."
              />
              {derived.agenda.length > CALENDAR_PREVIEW_LIMIT && (
                <button type="button" className="dash-agenda-vermais" onClick={() => navigate("/app/deadlines")}>
                  Ver mais
                </button>
              )}
            </div>
          </DashCard>

          <DashCard
            icon={ChatCircleText}
            tone="verde"
            title="Mensagens"
            caption="Últimas mensagens recebidas"
            onOpen={() => navigate("/app/chat")}
          >
            {derived.conversations.length === 0 ? (
              <DashEmpty>Suas conversas aparecerão aqui.</DashEmpty>
            ) : (
              derived.conversations.map((conversa) => (
                <DashRow
                  key={conversa.id}
                  title={conversa.titulo ?? "Conversa"}
                  subtitle={conversa.ultimaMensagem ?? "Nenhuma mensagem ainda"}
                  avatar={
                    <DashAvatar
                      src={conversa.fotoPerfilUrl || undefined}
                      initials={getInitials(conversa.titulo)}
                    />
                  }
                  trailing={formatTime(conversa.ultimaMensagemHorario)}
                  onOpen={() => navigate("/app/chat")}
                  openLabel={`Abrir conversa ${conversa.titulo ?? ""}`}
                />
              ))
            )}
          </DashCard>
        </div>
      </div>
      </DashFit>
    </motion.div>
  );
}
