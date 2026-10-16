import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CaretLeft, CaretRight, WarningCircle, ClipboardText } from "@phosphor-icons/react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { etapaService } from "../services/etapaService";
import { mapEtapa } from "../utils/adapters";
import { formatEtapaResponsavel, formatEtapaStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { Sk } from "../components/Skeleton";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const ALL_PROJECTS_VALUE = "Todos";

// Grade, meses e títulos são estáticos; só as listas de etapas aguardam a API.
function DeadlineListSkeleton({ compact = false }) {
  return (
    <div className="calendario-lista calendario-lista--rolagem" aria-busy="true" aria-label="Carregando prazos">
      {[0, 1, 2].map((item) => (
        <article key={item} className="calendario-prazo">
          <Sk w={36} h={36} r="50%" />
          <div className="calendario-prazo__conteudo">
            <Sk w="72%" h={15} r={999} />
            <Sk w="54%" h={12} r={999} style={{ marginTop: 8 }} />
            {!compact && <Sk w="88%" h={12} r={999} style={{ marginTop: 10 }} />}
          </div>
        </article>
      ))}
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

// Tom visual da etapa: concluída, em andamento, atrasada (prazo vencido) ou pendente.
function statusTone(item) {
  if (item.status === "DONE") return "concluida";
  if (item.status === "REJECTED") return "atrasada";
  const due = getDueDate(item);
  if (due && toDateKey(due) < toDateKey(new Date())) return "atrasada";
  return item.status === "ACTIVE" ? "andamento" : "pendente";
}

const TONE_ETIQUETA = {
  concluida: "advisor-etiqueta--cinza",
  andamento: "advisor-etiqueta--amarelo",
  atrasada: "advisor-etiqueta--vermelho",
  pendente: "advisor-etiqueta--verde",
};

const TONE_LEGENDA = [
  ["pendente", "Pendente"],
  ["andamento", "Em andamento"],
  ["concluida", "Concluída"],
  ["atrasada", "Atrasada ou rejeitada"],
];

function DeadlineItem({ item, compact = false }) {
  return (
    <article className={`calendario-prazo calendario-prazo--${statusTone(item)} ${compact ? "calendario-prazo--compacto" : ""}`}>
      <div className="calendario-prazo__icone">
        <CalendarCheck size={16} />
      </div>
      <div className="calendario-prazo__conteudo">
        <h3 className="calendario-prazo__titulo">{item.titulo}</h3>
        <p className="calendario-prazo__meta">{item.projectTitle}</p>
        {!compact && (
          <div className="calendario-prazo__detalhes">
            <span>{formatCalendarDate(item)}</span>
            <span>{formatEtapaResponsavel(item.responsavel)}</span>
            <span className={`advisor-etiqueta ${TONE_ETIQUETA[statusTone(item)]}`}>
              {statusTone(item) === "atrasada" && item.status !== "REJECTED" ? "Atrasada" : formatEtapaStatus(item.status)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function StudentDeadlinesPage() {
  const [tooltipPlacements, setTooltipPlacements] = useState({});
  const [hoverTooltipKey, setHoverTooltipKey] = useState(null);
  const [activeTooltipKey, setActiveTooltipKey] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS_VALUE);
  // null = o usuário ainda não navegou: abre no mês de hoje (ou no mais próximo com prazos).
  const [pickedMonth, setPickedMonth] = useState(null);

  const { data, loading, error } = useAsyncData(async () => {
    const result = await etapaService.listMine();
    const rawStages = Array.isArray(result) ? result : result?.content ?? result?.data ?? [];
    const deadlines = rawStages
      .map((rawStage) => {
        const stage = mapEtapa(rawStage);
        return stage
          ? {
              ...stage,
              status: String(stage.status ?? "PENDING").toUpperCase(),
              projectId: stage.projetoId,
              projectTitle: rawStage?.projetoTitulo ?? rawStage?.tituloProjeto ?? "Projeto",
            }
          : null;
      })
      .filter(Boolean);
    const projectsById = new Map();
    deadlines.forEach((deadline) => {
      if (deadline.projectId != null) {
        projectsById.set(String(deadline.projectId), {
          id: deadline.projectId,
          title: deadline.projectTitle,
        });
      }
    });

    return { projects: [...projectsById.values()], deadlines };
  }, [], { initialData: { projects: [], deadlines: [] } });

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
  const visibleMonth = useMemo(() => {
    if (pickedMonth) return pickedMonth;
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (scheduled.length === 0 || scheduled.some((item) => {
      const date = getDueDate(item);
      return date.getFullYear() === thisMonth.getFullYear() && date.getMonth() === thisMonth.getMonth();
    })) return thisMonth;
    const nearest = scheduled.reduce((best, item) => (
      Math.abs(getDueDate(item) - today) < Math.abs(getDueDate(best) - today) ? item : best
    ));
    const date = getDueDate(nearest);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }, [pickedMonth, scheduled]);
  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthItems = scheduled.filter((item) => {
    const date = getDueDate(item);
    return date && date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
  });

  const moveMonth = (amount) => {
    setPickedMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1));
    setActiveTooltipKey(null);
    setHoverTooltipKey(null);
  };


  useEffect(() => {
    if (!activeTooltipKey && !hoverTooltipKey) return undefined;

    const closeTooltip = () => {
      setActiveTooltipKey(null);
      setHoverTooltipKey(null);
    };
    const closeTooltipOnPageScroll = (event) => {
      if (event.target instanceof Element && event.target.closest(".calendario-dia__tooltip")) return;
      closeTooltip();
    };

    window.addEventListener("pointerdown", closeTooltip, true);
    window.addEventListener("scroll", closeTooltipOnPageScroll, true);
    window.addEventListener("resize", closeTooltip);
    return () => {
      window.removeEventListener("pointerdown", closeTooltip, true);
      window.removeEventListener("scroll", closeTooltipOnPageScroll, true);
      window.removeEventListener("resize", closeTooltip);
    };
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
        <div className="calendario-cabecalho__acoes">
          <div className="calendario-cabecalho__filtro">
            <span>Projeto</span>
            {loading ? (
              <Sk w="100%" h={42} r="var(--raio-medio)" style={{ marginTop: 8 }} />
            ) : (
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
            )}
          </div>
          <div className="calendario-cabecalho__resumo">
            <strong>{loading ? <Sk w={44} h={32} r={10} style={{ margin: "0 auto" }} /> : scheduled.length}</strong>
            <span>itens no calendário</span>
          </div>
        </div>
      </header>

      {!loading && scheduled.length === 0 && withoutDate.length === 0 ? (
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone"><ClipboardText size={24} /></div>
          <h2 className="advisor-estado-vazio__titulo">Nenhum prazo cadastrado</h2>
          <p className="advisor-estado-vazio__descricao">Datas de entrega criadas nas etapas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="calendario-layout">
          <section className="calendario-card calendario-card--principal">
            <div className="calendario-card__topo">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior">
                <CaretLeft size={17} />
              </button>
              <h2>{monthLabel(visibleMonth)}</h2>
              <button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês">
                <CaretRight size={17} />
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
                      {items.slice(0, items.length > 2 ? 1 : 2).map((item) => (
                        <span
                          key={`${item.projectId}-${item.id}`}
                          className={`calendario-evento calendario-evento--${statusTone(item)}`}
                        >
                          <span className="calendario-evento__rotulo">{item.titulo}</span>
                        </span>
                      ))}
                      {items.length > 2 && <small>+{items.length - 1} etapas</small>}
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
                              className={`calendario-dia__tooltip-item calendario-evento--${statusTone(item)}`}
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
            <ul className="calendario-legenda" aria-label="Legenda de status">
              {TONE_LEGENDA.map(([tone, label]) => (
                <li key={tone} className={`calendario-legenda__item calendario-evento--${tone}`}>{label}</li>
              ))}
            </ul>
          </section>

          <aside className="calendario-lateral">
            <section className="calendario-card calendario-card--lateral">
              <h2 className="calendario-card__titulo">Este mês</h2>
              {loading ? (
                <DeadlineListSkeleton />
              ) : monthItems.length === 0 ? (
                <p className="calendario-vazio">Nenhuma entrega neste mês.</p>
              ) : (
                <div className="calendario-lista calendario-lista--rolagem">
                  {monthItems.map((item) => <DeadlineItem key={`${item.projectId}-${item.id}`} item={item} />)}
                </div>
              )}
            </section>

            <section className="calendario-card calendario-card--lateral calendario-card--alerta">
              <div className="calendario-alerta__topo">
                <WarningCircle size={17} />
                <h2>Etapas sem data</h2>
              </div>
              {loading ? (
                <DeadlineListSkeleton compact />
              ) : withoutDate.length === 0 ? (
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
