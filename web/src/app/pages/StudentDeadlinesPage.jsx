import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, CircleAlert, ClipboardList } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { userService } from "../services/userService";
import { etapaService } from "../services/etapaService";
import { applicationService } from "../services/applicationService";
import { mapEtapa, mapProject } from "../utils/adapters";
import { formatEtapaResponsavel, formatEtapaStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const ALL_PROJECTS_VALUE = "Todos";

const Sk = ({ w = "100%", h = 14, r = "0.5rem", style }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function CalendarSkeleton() {
  return (
    <div className="calendario-pagina" aria-busy="true" aria-label="Carregando calendário">
      <header className="calendario-cabecalho">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sk w={150} h={13} r={999} />
          <Sk w="52%" h={30} r={10} style={{ maxWidth: 340, marginTop: 12 }} />
          <Sk w="76%" h={14} r={999} style={{ maxWidth: 560, marginTop: 14 }} />
        </div>
        <div className="calendario-cabecalho__filtro calendario-cabecalho__filtro--skeleton">
          <Sk w={64} h={12} r={999} />
          <Sk w="100%" h={42} r="var(--raio-medio)" style={{ marginTop: 8 }} />
        </div>
        <div className="calendario-cabecalho__resumo">
          <Sk w={44} h={32} r={10} style={{ margin: "0 auto" }} />
          <Sk w={118} h={12} r={999} style={{ marginTop: 8 }} />
        </div>
      </header>

      <div className="calendario-layout">
        <section className="calendario-card calendario-card--principal">
          <div className="calendario-card__topo">
            <Sk w={36} h={36} r="50%" />
            <Sk w={190} h={24} r={999} />
            <Sk w={36} h={36} r="50%" />
          </div>

          <div className="calendario-grade calendario-grade--semana">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendario-grade">
            {Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className={`calendario-dia ${index < 3 || index > 35 ? "calendario-dia--fora" : ""}`}>
                <Sk w={24} h={14} r={999} />
                <div className="calendario-dia__eventos">
                  {[6, 12, 19, 27, 33].includes(index) && <Sk w="74%" h={16} r={999} />}
                  {[19, 27].includes(index) && <Sk w="52%" h={16} r={999} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="calendario-lateral">
          {[0, 1].map((section) => (
            <section key={section} className={`calendario-card calendario-card--lateral ${section === 1 ? "calendario-card--alerta" : ""}`}>
              <Sk w={section === 0 ? 96 : 148} h={20} r={999} />
              <div className="calendario-lista calendario-lista--rolagem">
                {[0, 1, 2].map((item) => (
                  <article key={item} className="calendario-prazo">
                    <Sk w={36} h={36} r="50%" />
                    <div className="calendario-prazo__conteudo">
                      <Sk w="72%" h={15} r={999} />
                      <Sk w="54%" h={12} r={999} style={{ marginTop: 8 }} />
                      {section === 0 && <Sk w="88%" h={12} r={999} style={{ marginTop: 10 }} />}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

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
  if (status === "DONE") return "advisor-etiqueta--verde";
  if (status === "ACTIVE") return "advisor-etiqueta--amarelo";
  if (status === "REJECTED") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--vermelho";
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

  if (user.tipo === "ORIENTADOR") {
    const raw = await advisorService.meusProjetos();
    return (Array.isArray(raw) ? raw : [])
      .map(mapProject)
      .filter((project) => project?.id);
  }

  const [ownedProjects, applications] = await Promise.all([
    userService.getProjects(user.id).catch(() => []),
    applicationService.listMine().catch(() => []),
  ]);
  const approvedApplicationProjects = (Array.isArray(applications) ? applications : [])
    .filter((application) => application?.status === "APROVADO")
    .map((application) => application?.projeto ?? application?.project)
    .filter(Boolean);
  const projectsById = new Map();

  [...(Array.isArray(ownedProjects) ? ownedProjects : []), ...approvedApplicationProjects]
    .map(mapProject)
    .filter((project) => project?.id)
    .forEach((project) => projectsById.set(Number(project.id), project));

  return [...projectsById.values()];
}

async function loadProjectStages(project) {
  if (!project?.id) return [];

  const stages = await etapaService.list(project.id);
  return (Array.isArray(stages) ? stages : [])
    .map(mapEtapa)
    .filter(Boolean)
    .map((stage) => ({
      ...stage,
      status: String(stage.status ?? "PENDING").toUpperCase(),
      projectId: project.id,
      projectTitle: project.title,
    }));
}

export default function StudentDeadlinesPage() {
  const { user } = useAuth();
  const [tooltipPlacements, setTooltipPlacements] = useState({});
  const [hoverTooltipKey, setHoverTooltipKey] = useState(null);
  const [activeTooltipKey, setActiveTooltipKey] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS_VALUE);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const { data, loading, error } = useAsyncData(async () => {
    const projects = await loadProjectsForUser(user);
    const collections = await Promise.allSettled(projects.map(loadProjectStages));
    const deadlines = collections.flatMap((result) => (
      result.status === "fulfilled" ? result.value : []
    ));

    return { projects, deadlines };
  }, [user?.id, user?.tipo], { initialData: { projects: [], deadlines: [] } });

  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const allDeadlines = Array.isArray(data?.deadlines) ? data.deadlines : [];
  const projectFilterOptions = useMemo(
    () => [
      { value: ALL_PROJECTS_VALUE, label: "Todos" },
      ...projects.map((project) => ({ value: project.id, label: project.title })),
    ],
    [projects],
  );
  const selectedDeadlines = useMemo(
    () => selectedProjectId === ALL_PROJECTS_VALUE
      ? allDeadlines
      : allDeadlines.filter((item) => String(item.projectId) === String(selectedProjectId)),
    [allDeadlines, selectedProjectId],
  );
  const deadlines = useMemo(
    () => [...selectedDeadlines].sort((a, b) => (getDisplayDate(a)?.getTime() ?? Infinity) - (getDisplayDate(b)?.getTime() ?? Infinity)),
    [selectedDeadlines],
  );

  useEffect(() => {
    if (selectedProjectId === ALL_PROJECTS_VALUE) return;
    if (projects.some((project) => String(project.id) === String(selectedProjectId))) return;
    setSelectedProjectId(ALL_PROJECTS_VALUE);
  }, [projects, selectedProjectId]);

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
    setHoverTooltipKey(null);
  };


  useEffect(() => {
    if (!activeTooltipKey && !hoverTooltipKey) return undefined;

    const closeTooltip = () => {
      setActiveTooltipKey(null);
      setHoverTooltipKey(null);
    };

    window.addEventListener("pointerdown", closeTooltip, true);
    return () => window.removeEventListener("pointerdown", closeTooltip, true);
  }, [activeTooltipKey, hoverTooltipKey]);

  const toggleDayTooltip = (event, key) => {
    updateTooltipDirection(event, key);
    setActiveTooltipKey((current) => (current === key ? null : key));
  };

  const updateTooltipDirection = (event, key) => {
    const dayRect = event.currentTarget.getBoundingClientRect();
    const tooltip = event.currentTarget.querySelector(".calendario-dia__tooltip");
    if (!tooltip) return;

    const gap = 10;
    const viewportMargin = 16;
    const tooltipHeight = tooltip.scrollHeight;
    const tooltipWidth = Math.min(tooltip.scrollWidth, window.innerWidth - (viewportMargin * 2));
    const maxLeft = Math.max(viewportMargin, window.innerWidth - tooltipWidth - viewportMargin);
    const centeredLeft = dayRect.left + (dayRect.width / 2) - (tooltipWidth / 2);
    const viewportLeft = Math.min(Math.max(centeredLeft, viewportMargin), maxLeft);
    const spaceBelow = window.innerHeight - dayRect.bottom;
    const spaceAbove = dayRect.top;
    const direction = spaceBelow < tooltipHeight + gap && spaceAbove > spaceBelow ? "acima" : "abaixo";
    const preferredTop = direction === "acima" ? dayRect.top - tooltipHeight - gap : dayRect.bottom + gap;
    const maxTop = Math.max(viewportMargin, window.innerHeight - tooltipHeight - viewportMargin);
    const viewportTop = Math.min(Math.max(preferredTop, viewportMargin), maxTop);
    const arrowLeft = Math.round(dayRect.left + (dayRect.width / 2) - viewportLeft);
    const placement = {
      direction,
      left: Math.round(viewportLeft),
      top: Math.round(viewportTop),
      arrowLeft,
    };

    setTooltipPlacements((current) => (
      current[key]?.direction === placement.direction
      && current[key]?.left === placement.left
      && current[key]?.top === placement.top
      && current[key]?.arrowLeft === placement.arrowLeft
        ? current
        : { ...current, [key]: placement }
    ));
  };
  if (loading) return <CalendarSkeleton />;
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
        <div className="calendario-cabecalho__filtro">
          <span>Projeto</span>
          <AppCombobox
            ariaLabel="Filtrar calendário por projeto"
            className="calendario-projeto-select"
            value={selectedProjectId}
            onChange={(value) => {
              setSelectedProjectId(value);
              setActiveTooltipKey(null);
              setHoverTooltipKey(null);
            }}
            options={projectFilterOptions}
          />
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
                const canOpenTooltip = hasItems && !outside;
                const isTooltipOpen = canOpenTooltip && (activeTooltipKey === key || hoverTooltipKey === key);
                const tooltipPlacement = tooltipPlacements[key];
                return (
                  <div
                    key={key}
                    className={`calendario-dia ${outside ? "calendario-dia--fora" : ""} ${key === todayKey ? "calendario-dia--hoje" : ""} ${hasItems ? "calendario-dia--com-evento" : ""} ${isTooltipOpen ? "calendario-dia--tooltip-aberto" : ""} ${tooltipPlacement?.direction === "acima" ? "calendario-dia--tooltip-acima" : ""}`}
                    style={tooltipPlacement ? {
                      "--calendario-tooltip-left": `${tooltipPlacement.left}px`,
                      "--calendario-tooltip-top": `${tooltipPlacement.top}px`,
                      "--calendario-tooltip-arrow-left": `${tooltipPlacement.arrowLeft}px`,
                    } : undefined}
                    aria-label={canOpenTooltip ? `${date.getDate()} com ${items.length} ${items.length === 1 ? "evento" : "eventos"}` : undefined}
                    aria-expanded={canOpenTooltip ? isTooltipOpen : undefined}
                    tabIndex={canOpenTooltip ? 0 : undefined}
                    onClick={canOpenTooltip ? (event) => toggleDayTooltip(event, key) : undefined}
                    onKeyDown={canOpenTooltip ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      toggleDayTooltip(event, key);
                    } : undefined}
                    onMouseEnter={canOpenTooltip ? (event) => {
                      updateTooltipDirection(event, key);
                      setHoverTooltipKey(key);
                    } : undefined}
                    onFocus={canOpenTooltip ? (event) => {
                      updateTooltipDirection(event, key);
                      setHoverTooltipKey(key);
                    } : undefined}
                    onMouseLeave={canOpenTooltip ? () => setHoverTooltipKey(null) : undefined}
                    onBlur={canOpenTooltip ? () => setHoverTooltipKey(null) : undefined}
                  >
                    <span className="calendario-dia__numero">{date.getDate()}</span>
                    <div className="calendario-dia__eventos">
                      {items.slice(0, 3).map((item) => (
                        <span
                          key={`${item.projectId}-${item.id}`}
                          className="calendario-evento"
                        >
                          <span className="calendario-evento__rotulo">{item.titulo}</span>
                        </span>
                      ))}
                      {items.length > 3 && <small>+{items.length - 3} etapas</small>}
                    </div>
                    {canOpenTooltip && (
                      <div
                        className="calendario-dia__tooltip"
                        role="tooltip"
                        onPointerDownCapture={(event) => {
                          event.stopPropagation();
                          setActiveTooltipKey(null);
                          setHoverTooltipKey(null);
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
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
