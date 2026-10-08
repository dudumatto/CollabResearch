import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FolderOpen, FileText, ClipboardText, Warning, Users, CalendarCheck, TrendUp, ChatCircleText } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { etapaService } from "../services/etapaService";
import { conversationService } from "../services/conversationService";
import { mapOrientadorDashboard, mapDeadlineAgenda, getUserId } from "../utils/adapters";
import {
  formatProjectStatus,
  formatApplicationStatus,
  getInitials,
} from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { WelcomeBanner } from "../components/WelcomeBanner";
import {
  DashCard,
  DashMetric,
  DashRow,
  DashAvatar,
  DashEmpty,
  DashAgenda,
  DashListaCortada,
  DashFit,
} from "../components/DashboardKit";
import "../components/DashboardKit.css";

const DASHBOARD_PREVIEW_LIMIT = 3;
const MESSAGES_PREVIEW_LIMIT = 2;
// Calendário e Mensagens dividem a coluna lateral em partes
// desiguais (ver .dash-coluna--preencher / .dash-card--preencher).
const RIGHT_COLUMN_LIMIT = 6;
// Calendário mostra só os 3 prazos mais próximos inteiros; o 4º aparece
// cortado pela metade com fade (ver .dash-agenda-lista), convidando a
// clicar em "Ver mais" em vez de rolar a lista.
const CALENDAR_PREVIEW_LIMIT = 3;

function formatTime(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const now = new Date();
  const diff = now - date;
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

function SkeletonCard({ rows = 3, className = "" }) {
  return (
    <div className={`dash-card ${className}`}>
      <div className="dash-card__cabecalho">
        <Sk w={28} h={28} r="0.5rem" />
        <Sk w={150} h={16} />
      </div>
      <div className="dash-card__corpo" style={{ gap: "var(--espaco-4)", paddingTop: "var(--espaco-2)" }}>
        {Array.from({ length: rows }).map((_, i) => <Sk key={i} w="100%" h={30} />)}
      </div>
    </div>
  );
}

function AdvisorDashboardSkeleton() {
  return (
    <div className="dash" aria-busy="true" aria-label="Carregando painel do orientador">
      <Sk w="100%" h={140} r="var(--raio-grande)" />
      <div className="dash-grade">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} rows={1} />)}
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
        <div className="dash-coluna dash-coluna--preencher">
          <SkeletonCard rows={3} className="dash-card--preencher" />
          <SkeletonCard rows={3} className="dash-card--preencher" />
        </div>
      </div>
    </div>
  );
}

const applicationTone = {
  APROVADO: "verde",
  PENDENTE: "laranja",
  REJEITADO: "vermelho",
};

const projectTone = {
  ABERTO: "verde",
  EM_ANDAMENTO: "laranja",
  FINALIZADO: "neutro",
};

export default function AdvisorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = getUserId(user);

  const { data, loading, error } = useAsyncData(
    async () => {
      const [dashboard, prazos, conversas] = await Promise.all([
        advisorService.dashboard(),
        etapaService.listMine().catch(() => []),
        userId != null ? conversationService.listByUser(userId).catch(() => []) : Promise.resolve([]),
      ]);

      return {
        ...mapOrientadorDashboard(dashboard),
        agenda: mapDeadlineAgenda(prazos, RIGHT_COLUMN_LIMIT),
        conversations: Array.isArray(conversas) ? conversas : [],
      };
    },
    [userId],
    {
      initialData: {
        metricas: {
          inscricoesPendentes: 0,
          etapasAtrasadas: 0,
          entregasAguardandoRevisao: 0,
        },
        filas: {},
        agenda: [],
        conversations: [],
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
  const agenda = data?.agenda ?? [];
  const go = (destino) => navigate(destino);

  const etapasAtrasadas = (filas.etapasAtrasadas ?? []).slice(0, DASHBOARD_PREVIEW_LIMIT);
  const entregasAguardandoRevisao = (filas.entregasAguardandoRevisao ?? []).slice(0, DASHBOARD_PREVIEW_LIMIT);

  // "Ver mais" só aparece quando a lista tem mais itens do que o limite
  // exibido — nesse caso mostra limite+1 (o excedente fica cortado com fade,
  // ver DashListaCortada) em vez de rolar.
  const inscricoesTotal = filas.inscricoesPendentes ?? [];
  const inscricoesExcede = inscricoesTotal.length > DASHBOARD_PREVIEW_LIMIT;
  const inscricoesPendentes = inscricoesTotal.slice(0, DASHBOARD_PREVIEW_LIMIT + (inscricoesExcede ? 1 : 0));

  const projetosTotal = filas.projetosAtivos ?? [];
  const projetosExcede = projetosTotal.length > DASHBOARD_PREVIEW_LIMIT;
  const projetosAtivos = projetosTotal.slice(0, DASHBOARD_PREVIEW_LIMIT + (projetosExcede ? 1 : 0));

  const conversations = (data?.conversations ?? []).slice(0, MESSAGES_PREVIEW_LIMIT);

  const pendingTotal =
    (metricas.inscricoesPendentes ?? 0) +
    (metricas.etapasAtrasadas ?? 0) +
    (metricas.entregasAguardandoRevisao ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="dash"
    >
      <DashFit>
      <WelcomeBanner
        name={user?.nome?.split(" ")[0] ?? "professor(a)"}
        role="Orientador"
        institution={user?.instituicao}
        summary={pendingTotal > 0
          ? <>Você tem <strong>{pendingTotal} pendências</strong> para revisar antes de seguir a rotina.</>
          : <>Nenhuma <strong>pendência crítica</strong> no momento.</>}
        secondaryAction={{ label: "Ver progresso", icon: TrendUp, onClick: () => go("/app/progress") }}
        primaryAction={{ label: "Ver inscrições", icon: FileText, onClick: () => go("/app/applications") }}
      />

      <div className="dash-grade">
        <DashMetric
          icon={FileText}
          tone="azul"
          title="Inscrições"
          caption="Inscrições aguardando análise"
          value={metricas.inscricoesPendentes ?? 0}
          onOpen={() => go("/app/applications")}
        />
        <DashMetric
          icon={TrendUp}
          tone="verde"
          title="Progresso"
          caption="Etapas atrasadas em seu projeto"
          value={metricas.etapasAtrasadas ?? 0}
          onOpen={() => go("/app/progress")}
        />
        <DashMetric
          icon={ClipboardText}
          tone="laranja"
          title="Entregas"
          caption="Entregas aguardando revisão"
          value={metricas.entregasAguardandoRevisao ?? 0}
          onOpen={() => go("/app/deliveries")}
        />
      </div>

      <div className="dash-colunas">
        <div className="dash-coluna">
          <DashCard
            icon={FileText}
            tone="azul"
            title="Inscrições pendentes"
            caption="Resumo de suas inscrições pendentes para análise"
            onOpen={() => go("/app/applications")}
          >
            {inscricoesPendentes.length === 0 ? (
              <DashEmpty>Nenhuma inscrição aguardando análise.</DashEmpty>
            ) : (
              <DashListaCortada excedeLimite={inscricoesExcede} onVerMais={() => go("/app/applications")}>
                {inscricoesPendentes.map((item, index) => (
                  <DashRow
                    key={`${item.id}-${index}`}
                    title={item.titulo}
                    subtitle={item.subtitulo}
                    badge={item.status ? formatApplicationStatus(item.status) : undefined}
                    badgeTone={applicationTone[item.status] ?? "laranja"}
                    onOpen={item.destino ? () => go(item.destino) : undefined}
                    openLabel={item.titulo}
                  />
                ))}
              </DashListaCortada>
            )}
          </DashCard>

          <div className="dash-grade" style={{ "--dash-colunas": 2 }}>
            <DashCard
              icon={Warning}
              tone="vermelho"
              title="Etapas atrasadas"
              onOpen={() => go("/app/progress")}
            >
              {etapasAtrasadas.length === 0 ? (
                <DashEmpty>Nenhuma etapa atrasada.</DashEmpty>
              ) : (
                etapasAtrasadas.map((item, index) => (
                  <DashRow
                    key={`${item.id}-${index}`}
                    title={item.titulo}
                    subtitle={item.subtitulo}
                    onOpen={item.destino ? () => go(item.destino) : undefined}
                    openLabel={item.titulo}
                  />
                ))
              )}
            </DashCard>

            <DashCard
              icon={Users}
              tone="roxo"
              title="Entregas aguardando revisão"
              onOpen={() => go("/app/deliveries")}
            >
              {entregasAguardandoRevisao.length === 0 ? (
                <DashEmpty>Nenhuma entrega aguardando revisão.</DashEmpty>
              ) : (
                entregasAguardandoRevisao.map((item, index) => (
                  <DashRow
                    key={`${item.id}-${index}`}
                    title={item.titulo}
                    subtitle={item.subtitulo}
                    onOpen={item.destino ? () => go(item.destino) : () => go("/app/deliveries")}
                    openLabel={item.titulo}
                  />
                ))
              )}
            </DashCard>
          </div>

          <DashCard
            icon={FolderOpen}
            tone="laranja"
            title="Projetos Ativos"
            onOpen={() => go("/app/projects")}
          >
            {projetosAtivos.length === 0 ? (
              <DashEmpty>Nenhum projeto ativo no momento.</DashEmpty>
            ) : (
              <DashListaCortada excedeLimite={projetosExcede} onVerMais={() => go("/app/projects")}>
                {projetosAtivos.map((item, index) => (
                  <DashRow
                    key={`${item.id}-${index}`}
                    title={item.titulo}
                    subtitle={item.subtitulo}
                    badge={item.status ? formatProjectStatus(item.status) : undefined}
                    badgeTone={projectTone[item.status] ?? "neutro"}
                    onOpen={item.destino ? () => go(item.destino) : undefined}
                    openLabel={item.titulo}
                  />
                ))}
              </DashListaCortada>
            )}
          </DashCard>
        </div>

        <div className="dash-coluna dash-coluna--preencher">
          <DashCard
            icon={CalendarCheck}
            tone="roxo"
            title="Calendário"
            caption="Veja seus próximos prazos"
            onOpen={() => go("/app/deadlines")}
            className="dash-card--sombra dash-card--calendario"
          >
            <div className="dash-agenda-lista">
              <DashAgenda
                items={agenda.slice(0, CALENDAR_PREVIEW_LIMIT + 1)}
                emptyLabel="Nenhum prazo próximo cadastrado."
              />
              {agenda.length > CALENDAR_PREVIEW_LIMIT && (
                <button type="button" className="dash-agenda-vermais" onClick={() => go("/app/deadlines")}>
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
            onOpen={() => go("/app/chat")}
            className="dash-card--preencher"
          >
            {conversations.length === 0 ? (
              <DashEmpty>Suas conversas aparecerão aqui.</DashEmpty>
            ) : (
              conversations.map((conversa) => (
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
                  onOpen={() => go("/app/chat")}
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
