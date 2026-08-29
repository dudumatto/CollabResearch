import { useMemo, useState } from "react";
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

function getDisplayDate(item) {
  return parseDate(item.prazo) ?? parseDate(item.criadaEm);
}

function getDueDate(item) {
  return parseDate(item.prazo);
}

function formatCalendarDate(item) {
  if (parseDate(item.prazo)) return formatLocalDate(item.prazo);
  const criadaEm = parseDate(item.criadaEm);
  return criadaEm ? `Sem prazo específico - cadastrada em ${formatLocalDate(item.criadaEm)}` : "Sem prazo específico";
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
  if (status === "DONE") return "advisor-etiqueta--vermelho";
  if (status === "ACTIVE") return "advisor-etiqueta--amarelo";
  if (status === "REJECTED") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--verde";
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
            <span>{formatCalendarDate(item)}</span>
            <span>{formatEtapaResponsavel(item.responsavel)}</span>
            <span className={`advisor-etiqueta ${statusClass(item.status)}`}>{formatEtapaStatus(item.status)}</span>
          </div>
        )}
      </div>
    </article>
  );
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
  const [tooltipDirections, setTooltipDirections] = useState({});
  const [activeTooltipKey, setActiveTooltipKey] = useState(null);
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
        .filter(Boolean)
        .map((stage) => ({
          ...stage,
          status: String(stage.status ?? "PENDING").toUpperCase(),
          projectId: project.id,
          projectTitle: project.title,
        })),
    );
  }, [user?.id, user?.tipo], { initialData: [] });

  const deadlines = useMemo(
    () => (Array.isArray(data) ? data : []).sort((a, b) => (getDisplayDate(a)?.getTime() ?? Infinity) - (getDisplayDate(b)?.getTime() ?? Infinity)),
    [data],
  );

  const scheduled = deadlines.filter((item) => getDueDate(item));
  const withoutDate = deadlines.filter((item) => !getDueDate(item));
  const byDay = useMemo(() => {
    const map = new Map();
    scheduled.forEach((item) => {
      const key = toDateKey(getDueDate(item));
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [scheduled]);

  const todayKey = toDateKey(new Date());
  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthItems = scheduled.filter((item) => {
    const date = getDueDate(item);
    return date && date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
  });

  const moveMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    setActiveTooltipKey(null);
  };

  const toggleDayTooltip = (event, key) => {
    updateTooltipDirection(event, key);
    setActiveTooltipKey((current) => (current === key ? null : key));
  };

  const updateTooltipDirection = (event, key) => {
    const dayRect = event.currentTarget.getBoundingClientRect();
    const tooltip = event.currentTarget.querySelector(".calendario-dia__tooltip");
    if (!tooltip) return;

    const gap = 10;
    const tooltipHeight = tooltip.scrollHeight;
    const spaceBelow = window.innerHeight - dayRect.bottom;
    const spaceAbove = dayRect.top;
    const direction = spaceBelow < tooltipHeight + gap && spaceAbove > spaceBelow ? "acima" : "abaixo";

    setTooltipDirections((current) => (
      current[key] === direction ? current : { ...current, [key]: direction }
    ));
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
          <span>itens no calendário</span>
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
          <section className="calendario-card calendario-card--principal">
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
                const hasItems = items.length > 0;
                const isTooltipOpen = activeTooltipKey === key;
                return (
                  <div
                    key={key}
                    className={`calendario-dia ${outside ? "calendario-dia--fora" : ""} ${key === todayKey ? "calendario-dia--hoje" : ""} ${hasItems ? "calendario-dia--com-evento" : ""} ${isTooltipOpen ? "calendario-dia--tooltip-aberto" : ""} ${tooltipDirections[key] === "acima" ? "calendario-dia--tooltip-acima" : ""}`}
                    aria-label={hasItems ? `${date.getDate()} com ${items.length} ${items.length === 1 ? "evento" : "eventos"}` : undefined}
                    aria-expanded={hasItems ? isTooltipOpen : undefined}
                    tabIndex={hasItems ? 0 : undefined}
                    onClick={hasItems ? (event) => toggleDayTooltip(event, key) : undefined}
                    onKeyDown={hasItems ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      toggleDayTooltip(event, key);
                    } : undefined}
                    onMouseEnter={hasItems ? (event) => updateTooltipDirection(event, key) : undefined}
                    onFocus={hasItems ? (event) => updateTooltipDirection(event, key) : undefined}
                  >
                    <span className="calendario-dia__numero">{date.getDate()}</span>
                    <div className="calendario-dia__eventos">
                      {items.slice(0, 2).map((item) => (
                        <span
                          key={`${item.projectId}-${item.id}`}
                          className="calendario-evento"
                        >
                          <span className="calendario-evento__rotulo">{item.titulo}</span>
                        </span>
                      ))}
                      {items.length > 2 && <small>+{items.length - 2} etapas</small>}
                      {items.length > 0 && (
                        <div className="calendario-dia__tooltip" role="tooltip" onClick={(event) => event.stopPropagation()}>
                          <div className="calendario-dia__tooltip-topo">
                            <strong>{items.length} {items.length === 1 ? "etapa" : "etapas"}</strong>
                            <span>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(date)}</span>
                        </div>
                          <div className="calendario-dia__tooltip-lista">
                            {items.map((item) => (
                              <div
                                key={`tooltip-${item.projectId}-${item.id}`}
                                className="calendario-dia__tooltip-item"
                              >
                                <strong>{item.titulo}</strong>
                                <span>{item.projectTitle}</span>
                                <small>
                                  {formatCalendarDate(item)} · {formatEtapaResponsavel(item.responsavel)} · {formatEtapaStatus(item.status)}
                                </small>
                              </div>
                            ))}
                        </div>
                      </div>
                      )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>

          <aside className="calendario-lateral">
            <section className="calendario-card calendario-card--lateral">
              <h2 className="calendario-card__titulo">Este mês</h2>
              {monthItems.length === 0 ? (
                <p className="calendario-vazio">Nenhuma entrega neste mês.</p>
              ) : (
                <div className="calendario-lista calendario-lista--rolagem">
                  {monthItems.map((item) => <DeadlineItem key={`${item.projectId}-${item.id}`} item={item} />)}
                </div>
              )}
            </section>

            <section className="calendario-card calendario-card--lateral calendario-card--alerta">
              <div className="calendario-alerta__topo">
                <CircleAlert size={17} />
                <h2>Etapas sem data</h2>
              </div>
              {withoutDate.length === 0 ? (
                <p className="calendario-vazio">Nenhuma etapa sem data.</p>
                ) : (
                <div className="calendario-lista calendario-lista--rolagem">
                  {withoutDate.map((item) => <DeadlineItem key={`${item.projectId}-${item.id}`} item={item} compact />)}
                </div>
                )}
              </section>
          </aside>
        </div>
      )}
    </div>
  );
}

