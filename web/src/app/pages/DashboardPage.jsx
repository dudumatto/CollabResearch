import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FileText, Bell, TrendUp, MagnifyingGlass, Warning, CalendarCheck, ChatCircleText, Star } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useNotifications } from "../providers/NotificationsProvider";
import { projectService } from "../services/projectService";
import { applicationService } from "../services/applicationService";
import { etapaService } from "../services/etapaService";
import { conversationService } from "../services/conversationService";
import { progressService } from "../services/progressService";
import { userService } from "../services/userService";
import { evaluationService } from "../services/evaluationService";
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
  DashPendentes,
  DashFit,
  DashEvaluations,
} from "../components/DashboardKit";
import {
  mapAvaliacaoAcademica,
  mapApplication,
  mapProject,
  mapDeadlineAgenda,
  getUserId,
  mapEtapa,
} from "../utils/adapters";
import { formatApplicationStatus, getInitials } from "../utils/formatters";
import "../components/DashboardKit.css";

const DASHBOARD_PREVIEW_LIMIT = 3;
const MESSAGES_PREVIEW_LIMIT = 2;
// Calendário mostra 3 prazos inteiros + o 4º cortado com fade e "Ver mais"
// (mesmo comportamento do painel do orientador, ver AdvisorDashboardPage).
const CALENDAR_PREVIEW_LIMIT = 3;
const PENDING_STEPS_PREVIEW_LIMIT = 2;

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

// Mesma regra do painel do orientador (OrientadorService.estaAtrasada): etapa
// com prazo vencido que não foi concluída nem rejeitada. Fonte: /api/me/prazos-etapas.
function mapOverdueDeliveries(rawStages) {
  const list = Array.isArray(rawStages) ? rawStages : [];
  const now = Date.now();
  return list
    .map((raw) => {
      const etapa = mapEtapa(raw);
      const prazo = new Date(etapa?.prazo ?? "").getTime();
      if (Number.isNaN(prazo) || prazo >= now) return null;
      if (etapa.status === "DONE" || etapa.status === "REJECTED") return null;
      const projetoId = raw?.projetoId ?? null;
      const projetoTitulo = raw?.projetoTitulo ?? "Projeto";
      return {
        id: etapa.id,
        prazo,
        titulo: etapa.titulo,
        subtitulo: `${projetoTitulo} - prazo ${formatShortDate(prazo)}`,
        destino: projetoId != null ? `/app/projects/${projetoId}` : "/app/progress",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.prazo - b.prazo);
}

// Etapas ainda não concluídas (PENDING, ACTIVE, REJECTED), as de prazo mais próximo primeiro.
function mapPendingSteps(rawStages) {
  const list = Array.isArray(rawStages) ? rawStages : rawStages?.content ?? rawStages?.data ?? [];
  return list
    .map((raw) => ({ etapa: mapEtapa(raw), projeto: raw?.projetoTitulo ?? raw?.tituloProjeto ?? "Projeto" }))
    .filter(({ etapa }) => etapa && etapa.status !== "DONE")
    .sort((a, b) => String(a.etapa.prazo ?? "9999").localeCompare(String(b.etapa.prazo ?? "9999")))
    .map(({ etapa, projeto }) => ({
      id: etapa.id ?? `${projeto}-${etapa.titulo}`,
      title: etapa.titulo,
      subtitle: projeto,
    }));
}

async function loadEvaluations(userId) {
  const projects = await userService.getProjects(userId).catch(() => []);
  const ids = (Array.isArray(projects) ? projects.map(mapProject) : [])
    .map((project) => project.id)
    .filter((id) => id != null);
  const lists = await Promise.all(
    ids.map((id) => evaluationService.list(id).catch(() => [])),
  );
  return lists
    .flatMap((items) => (Array.isArray(items) ? items.map(mapAvaliacaoAcademica) : []))
    .filter(Boolean)
    .sort((a, b) => String(b.criadaEm ?? "").localeCompare(String(a.criadaEm ?? "")));
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

    const evaluations = userId != null ? await loadEvaluations(userId) : [];
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
      pendingSteps: mapPendingSteps(prazos),
      entregasAtrasadas: mapOverdueDeliveries(prazos),
      conversations: Array.isArray(conversas) ? conversas : [],
      evaluations,
      progress,
    };
  }, [userId], {
    initialData: { projects: [], applications: [], agenda: [], entregasAtrasadas: [], conversations: [], evaluations: [], progress: null, pendingSteps: [] },
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
      pendingSteps: (data?.pendingSteps ?? []).slice(0, PENDING_STEPS_PREVIEW_LIMIT),
      entregasAtrasadas: (data?.entregasAtrasadas ?? []).slice(0, DASHBOARD_PREVIEW_LIMIT),
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

        <DashCard
          icon={TrendUp}
          tone="verde"
          title="Etapas pendentes"
          onOpen={() => navigate("/app/progress")}
        >
          <DashPendentes items={derived.pendingSteps} />
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

            <DashCard
              icon={Warning}
              tone="vermelho"
              title="Entregas atrasadas"
              onOpen={() => navigate("/app/progress")}
            >
              {derived.entregasAtrasadas.length === 0 ? (
                <DashEmpty>Nenhuma entrega atrasada.</DashEmpty>
              ) : (
                derived.entregasAtrasadas.map((item, index) => (
                  <DashRow
                    key={`${item.id}-${index}`}
                    title={item.titulo}
                    subtitle={item.subtitulo}
                    onOpen={() => navigate(item.destino)}
                    openLabel={item.titulo}
                  />
                ))
              )}
            </DashCard>
          </div>

          <DashCard
            icon={Star}
            tone="laranja"
            title="Avaliações"
            onOpen={() => navigate("/app/avaliacoes")}
            className="dash-card--igual"
          >
            <DashEvaluations items={data?.evaluations ?? []} />
          </DashCard>
        </div>

        {/* Coluna estica até a altura da esquerda; Mensagens absorve o restante
            e termina alinhada ao fim de Avaliações. */}
        <div className="dash-coluna dash-coluna--preencher">
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
            className="dash-card--preencher"
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
