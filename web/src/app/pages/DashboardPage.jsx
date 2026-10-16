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
import { Sk, SkLines } from "../components/Skeleton";
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
  unreadConversations,
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
  const userId = getUserId(user);

  const { notifications, loading: notificationsReloading } = useNotifications();
  // Recargas do provider (ex.: tempo real) não devem piscar skeleton sobre dados já exibidos.
  const notificationsLoading = notificationsReloading && notifications.length === 0;
  // Cada seção carrega sozinha: o layout estático aparece na hora e só os
  // dados ainda pendentes mostram skeleton.
  const { error } = useAsyncData(
    () => projectService.listPaged({}, { page: 0, size: DASHBOARD_PREVIEW_LIMIT }),
    [],
  );
  const applicationsState = useAsyncData(async () => {
    const applications = await applicationService.listMine().catch(() => []);
    return Array.isArray(applications) ? applications.map(mapApplication) : [];
  }, [], { initialData: [] });
  const prazosState = useAsyncData(async () => {
    const prazos = await etapaService.listMine().catch(() => []);
    return {
      agenda: mapDeadlineAgenda(prazos),
      pendingSteps: mapPendingSteps(prazos),
      entregasAtrasadas: mapOverdueDeliveries(prazos),
    };
  }, [], { initialData: { agenda: [], pendingSteps: [], entregasAtrasadas: [] } });
  const conversationsState = useAsyncData(async () => {
    const conversas = userId != null ? await conversationService.listByUser(userId).catch(() => []) : [];
    return Array.isArray(conversas) ? conversas : [];
  }, [userId], { initialData: [] });
  const evaluationsState = useAsyncData(
    () => (userId != null ? loadEvaluations(userId) : []),
    [userId],
    { initialData: [] },
  );

  const activeApplication = applicationsState.data.find(
    (item) => item.status === "APROVADO" && item.project?.status !== "FINALIZADO",
  );
  const activeProjectId = activeApplication?.project?.id ?? activeApplication?.projectId ?? null;
  const progressState = useAsyncData(
    () => (activeProjectId != null ? progressService.getProgress(activeProjectId).catch(() => null) : null),
    [activeProjectId],
  );
  const progressLoading = applicationsState.loading || progressState.loading;

  const derived = useMemo(() => {
    const applications = applicationsState.data;
    const progress = progressState.data;
    const steps = Array.isArray(progress?.steps) ? progress.steps : [];
    const doneSteps = steps.filter((step) => step.status === "DONE").length;

    return {
      recentApplications: applications.slice(0, DASHBOARD_PREVIEW_LIMIT),
      conversations: unreadConversations(conversationsState.data, MESSAGES_PREVIEW_LIMIT),
      agenda: prazosState.data.agenda,
      pendingSteps: prazosState.data.pendingSteps.slice(0, PENDING_STEPS_PREVIEW_LIMIT),
      entregasAtrasadas: prazosState.data.entregasAtrasadas.slice(0, DASHBOARD_PREVIEW_LIMIT),
      latestNotification: notifications[0] ?? null,
      unreadNotifications: notifications.filter((item) => !item.read).length,
      progress: progress
        ? { total: steps.length, done: doneSteps, percent: progress.overallPercent ?? 0 }
        : null,
    };
  }, [applicationsState.data, progressState.data, conversationsState.data, prazosState.data, notifications]);

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
          Você tem <strong>{notificationsLoading ? <Sk inline w="1.2em" h="0.9em" /> : derived.unreadNotifications} notificações</strong> pendentes e <strong>{applicationsState.loading ? <Sk inline w="1.2em" h="0.9em" /> : derived.recentApplications.length} inscrições</strong> vinculadas ao seu perfil.
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
          value={applicationsState.loading ? <Sk w={48} h={36} /> : derived.recentApplications.length}
          onOpen={() => navigate("/app/applications")}
        />

        <DashCard
          icon={Bell}
          tone="verde"
          title="Notificações recentes"
          onOpen={() => navigate("/app/notifications")}
        >
          {notificationsLoading ? (
            <SkLines rows={2} h={18} />
          ) : derived.latestNotification ? (
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
          {prazosState.loading ? <SkLines rows={2} h={24} /> : <DashPendentes items={derived.pendingSteps} />}
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
            {applicationsState.loading ? (
              <SkLines rows={3} />
            ) : derived.recentApplications.length === 0 ? (
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
              {progressLoading ? (
                <SkLines rows={2} h={20} />
              ) : derived.progress ? (
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
              {prazosState.loading ? (
                <SkLines rows={2} />
              ) : derived.entregasAtrasadas.length === 0 ? (
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
            {evaluationsState.loading ? (
              <SkLines rows={2} h={40} />
            ) : (
              <DashEvaluations items={evaluationsState.data} onOpen={() => navigate("/app/avaliacoes")} />
            )}
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
              {prazosState.loading ? (
                <SkLines rows={CALENDAR_PREVIEW_LIMIT} h={40} />
              ) : (
                <DashAgenda
                  items={derived.agenda.slice(0, CALENDAR_PREVIEW_LIMIT + 1)}
                  emptyLabel="Nenhum prazo próximo cadastrado."
                />
              )}
              {!prazosState.loading && derived.agenda.length > CALENDAR_PREVIEW_LIMIT && (
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
            caption="Mensagens não lidas"
            onOpen={() => navigate("/app/chat")}
            className="dash-card--preencher"
          >
            {conversationsState.loading ? (
              <SkLines rows={MESSAGES_PREVIEW_LIMIT} h={40} />
            ) : derived.conversations.length === 0 ? (
              <DashEmpty>Nenhuma mensagem não lida.</DashEmpty>
            ) : (
              derived.conversations.map((conversa) => (
                <DashRow
                  key={conversa.id}
                  title={conversa.titulo ?? "Conversa"}
                  subtitle={conversa.ultimaMensagem ?? "Nenhuma mensagem ainda"}
                  badge={conversa.mensagensNaoLidas}
                  badgeTone="verde"
                  avatar={
                    <DashAvatar
                      src={conversa.fotoPerfilUrl || undefined}
                      initials={getInitials(conversa.titulo)}
                    />
                  }
                  trailing={formatTime(conversa.ultimaMensagemHorario)}
                  onOpen={() => navigate("/app/chat", { state: { conversationId: conversa.id } })}
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
