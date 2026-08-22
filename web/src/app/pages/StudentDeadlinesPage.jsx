import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarClock, ChevronLeft, ChevronRight, CircleAlert, ClipboardList } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { userService } from "../services/userService";
import { etapaService } from "../services/etapaService";
import { mapEtapa, mapProject } from "../utils/adapters";
import { formatEtapaResponsavel, formatEtapaStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

function parseDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("pt-BR").format(date) : "Sem data";
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function buildMonthDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function statusClass(status) {
  if (status === "DONE") return "advisor-etiqueta--verde";
  if (status === "ACTIVE") return "advisor-etiqueta--roxo";
  if (status === "REJECTED") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--cinza";
}

function DeadlineItem({ item, compact = false }) {
  return (
    <article className={`calendario-prazo ${compact ? "calendario-prazo--compacto" : ""}`}>
      <div className="calendario-prazo__icone">
        <CalendarClock size={16} />
      </div>
      <div className="calendario-prazo__conteudo">
        <h3 className="calendario-prazo__titulo">{item.titulo}</h3>
        <p className="calendario-prazo__meta">{item.projectTitle}</p>
        {!compact && (
          <div className="calendario-prazo__detalhes">
            <span>{formatLocalDate(item.prazo)}</span>
            <span>{formatEtapaResponsavel(item.responsavel)}</span>
            <span className={`advisor-etiqueta ${statusClass(item.status)}`}>{formatEtapaStatus(item.status)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function deadlineTarget(item) {
  const params = new URLSearchParams({
    projectId: String(item.projectId),
    stageId: String(item.id),
  });
  return `/app/deliveries?${params.toString()}`;
}

async function loadProjectsForUser(user) {
  if (!user?.id) return [];
  const raw = user.tipo === "ORIENTADOR"
    ? await advisorService.meusProjetos()
    : await userService.getProjects(user.id);

  return (Array.isArray(raw) ? raw : []).map(mapProject);
}

export default function StudentDeadlinesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const { data, loading, error } = useAsyncData(async () => {
    const projects = await loadProjectsForUser(user);
    const collections = await Promise.all(projects.map(async (project) => ({
      project,
      stages: await etapaService.list(project.id).catch(() => []),
    })));

    return collections.flatMap(({ project, stages }) =>
      (Array.isArray(stages) ? stages : [])
        .map(mapEtapa)
        .filter((stage) => stage && stage.status !== "DONE")
        .map((stage) => ({
          ...stage,
          projectId: project.id,
          projectTitle: project.title,
        })),
    );
  }, [user?.id, user?.tipo], { initialData: [] });

  const deadlines = useMemo(
    () => (Array.isArray(data) ? data : []).sort((a, b) => (parseDate(a.prazo)?.getTime() ?? Infinity) - (parseDate(b.prazo)?.getTime() ?? Infinity)),
    [data],
  );

  const scheduled = deadlines.filter((item) => parseDate(item.prazo));
  const withoutDate = deadlines.filter((item) => !parseDate(item.prazo));
  const byDay = useMemo(() => {
    const map = new Map();
    scheduled.forEach((item) => {
      const key = toDateKey(parseDate(item.prazo));
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [scheduled]);

  const todayKey = toDateKey(new Date());
  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthItems = scheduled.filter((item) => {
    const date = parseDate(item.prazo);
    return date && date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
  });

  const moveMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const openDeadline = (item) => {
    navigate(deadlineTarget(item), { state: { projectId: item.projectId, stageId: item.id } });
  };

  if (loading) return <div className="skeleton" style={{ width: "100%", height: 360, borderRadius: "var(--raio-grande)" }} />;
  if (error) return <StatusView title="Falha ao carregar calendário" description="Não foi possível carregar as etapas dos seus projetos." />;

  return (
    <div className="calendario-pagina">
      <header className="calendario-cabecalho">
        <div>
          <p className="calendario-cabecalho__eyebrow">Calendário do projeto</p>
          <h1 className="calendario-cabecalho__titulo">Prazos das etapas</h1>
          <p className="calendario-cabecalho__descricao">
            Acompanhe as datas de entrega cadastradas no progresso dos projetos.
          </p>
        </div>
        <div className="calendario-cabecalho__resumo">
          <strong>{scheduled.length}</strong>
          <span>prazos agendados</span>
        </div>
      </header>

      {scheduled.length === 0 && withoutDate.length === 0 ? (
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone"><ClipboardList size={24} /></div>
          <h2 className="advisor-estado-vazio__titulo">Nenhum prazo cadastrado</h2>
          <p className="advisor-estado-vazio__descricao">Datas de entrega criadas nas etapas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="calendario-layout">
          <section className="calendario-card">
            <div className="calendario-card__topo">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior">
                <ChevronLeft size={17} />
              </button>
              <h2>{monthLabel(visibleMonth)}</h2>
              <button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês">
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="calendario-grade calendario-grade--semana">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendario-grade">
              {monthDays.map((date) => {
                const key = toDateKey(date);
                const items = byDay.get(key) ?? [];
                const outside = date.getMonth() !== visibleMonth.getMonth();
                return (
                  <div
                    key={key}
                    className={`calendario-dia ${outside ? "calendario-dia--fora" : ""} ${key === todayKey ? "calendario-dia--hoje" : ""} ${items.length ? "calendario-dia--com-evento" : ""}`}
                  >
                    <span className="calendario-dia__numero">{date.getDate()}</span>
                    <div className="calendario-dia__eventos">
                      {items.slice(0, 2).map((item) => (
                        <button
                          key={`${item.projectId}-${item.id}`}
                          type="button"
                          className="calendario-evento"
                          onClick={() => openDeadline(item)}
                          aria-label={`Abrir entrega ${item.titulo}`}
                        >
                          <span className="calendario-evento__rotulo">{item.titulo}</span>
                          <span className="calendario-evento__tooltip" role="tooltip">
                            <strong>{item.titulo}</strong>
                            <small>{item.projectTitle}</small>
                            <span>{formatLocalDate(item.prazo)}</span>
                            <span>{formatEtapaResponsavel(item.responsavel)}</span>
                            <em>{formatEtapaStatus(item.status)}</em>
                          </span>
                        </button>
                      ))}
                      {items.length > 2 && <small>+{items.length - 2}</small>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="calendario-lateral">
            <section className="calendario-card">
              <h2 className="calendario-card__titulo">Este mês</h2>
              {monthItems.length === 0 ? (
                <p className="calendario-vazio">Nenhuma entrega neste mês.</p>
              ) : (
                <div className="calendario-lista">
                  {monthItems.map((item) => <DeadlineItem key={`${item.projectId}-${item.id}`} item={item} />)}
                </div>
              )}
            </section>

            {withoutDate.length > 0 && (
              <section className="calendario-card calendario-card--alerta">
                <div className="calendario-alerta__topo">
                  <CircleAlert size={17} />
                  <h2>Etapas sem data</h2>
                </div>
                <div className="calendario-lista">
                  {withoutDate.map((item) => <DeadlineItem key={`${item.projectId}-${item.id}`} item={item} compact />)}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
