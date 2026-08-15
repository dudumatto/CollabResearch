import { useMemo } from "react";
import { CalendarClock, CircleAlert, ClipboardList } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { etapaService } from "../services/etapaService";
import { mapEtapa, mapProject } from "../utils/adapters";
import { StatusView } from "../components/StatusView";

function parseDate(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatLocalDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("pt-BR").format(date) : "Sem data";
}

function groupDeadlines(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + (7 - today.getDay()));
  const groups = { today: [], week: [], upcoming: [], withoutDate: [] };

  items.forEach((item) => {
    const date = parseDate(item.prazo);
    if (!date) groups.withoutDate.push(item);
    else if (date <= today) groups.today.push(item);
    else if (date > today && date <= weekEnd) groups.week.push(item);
    else if (date > weekEnd) groups.upcoming.push(item);
  });

  Object.values(groups).forEach((group) => group.sort((a, b) => (parseDate(a.prazo)?.getTime() ?? 0) - (parseDate(b.prazo)?.getTime() ?? 0)));
  return groups;
}

function DeadlineGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-2)" }}>
      <h2 style={{ fontSize: "var(--tamanho-normal)", fontWeight: "var(--peso-semi)", color: "var(--cor-texto)" }}>{title}</h2>
      {items.map((item) => (
        <article key={`${item.projectId}-${item.id}`} style={{ display: "flex", alignItems: "center", gap: "var(--espaco-3)", padding: "var(--espaco-3) var(--espaco-4)", border: "1px solid var(--cor-borda-clara)", borderRadius: "var(--raio-medio)", backgroundColor: "var(--cor-superficie)", flexWrap: "wrap" }}>
          <CalendarClock size={18} color="var(--cor-primaria)" aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: "var(--cor-texto-forte)", fontSize: "var(--tamanho-base)", fontWeight: "var(--peso-semi)" }}>{item.titulo}</h3>
            <p style={{ color: "var(--cor-texto-mudo)", fontSize: "var(--tamanho-pequeno)" }}>{item.projectTitle}</p>
          </div>
          <time dateTime={item.prazo} style={{ color: "var(--cor-texto-fraco)", fontSize: "var(--tamanho-pequeno)", fontWeight: "var(--peso-medio)" }}>{formatLocalDate(item.prazo)}</time>
        </article>
      ))}
    </section>
  );
}

export default function StudentDeadlinesPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsyncData(async () => {
    if (!user?.id) return [];
    const projects = (await userService.getProjects(user.id)).map(mapProject);
    const collections = await Promise.all(projects.map(async (project) => ({ project, stages: await etapaService.list(project.id) })));
    return collections.flatMap(({ project, stages }) => (Array.isArray(stages) ? stages : []).map(mapEtapa).filter((stage) => stage && stage.status !== "DONE").map((stage) => ({ ...stage, projectId: project.id, projectTitle: project.title })));
  }, [user?.id], { initialData: [] });

  const groups = useMemo(() => groupDeadlines(Array.isArray(data) ? data : []), [data]);
  const hasScheduled = groups.today.length + groups.week.length + groups.upcoming.length > 0;

  if (loading) return <div className="skeleton" style={{ width: "100%", height: 260, borderRadius: "var(--raio-grande)" }} />;
  if (error) return <StatusView title="Falha ao carregar prazos" description="Não foi possível carregar as etapas dos seus projetos." />;

  return (
    <div style={{ width: "100%", maxWidth: "64rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--espaco-5)" }}>
      <header>
        <p style={{ color: "var(--cor-primaria)", fontSize: "var(--tamanho-pequeno)", fontWeight: "var(--peso-semi)" }}>ORGANIZAÇÃO DO PROJETO</p>
        <h1 style={{ color: "var(--cor-texto)", fontSize: "var(--tamanho-titulo)", fontWeight: "var(--peso-negrito)" }}>Prazos</h1>
        <p style={{ color: "var(--cor-texto-mudo)", fontSize: "var(--tamanho-base)" }}>Acompanhe as etapas pendentes por data de conclusão.</p>
      </header>
      {!hasScheduled && groups.withoutDate.length === 0 && <div style={{ padding: "var(--espaco-6) var(--espaco-4)", textAlign: "center", border: "1px solid var(--cor-borda-clara)", borderRadius: "var(--raio-grande)", backgroundColor: "var(--cor-superficie)" }}><ClipboardList size={24} color="var(--cor-texto-mudo)" /><h2 style={{ color: "var(--cor-texto)", fontSize: "var(--tamanho-normal)" }}>Nenhum prazo pendente</h2><p style={{ color: "var(--cor-texto-mudo)", fontSize: "var(--tamanho-base)" }}>Etapas com prazo definido aparecerão aqui.</p></div>}
      <DeadlineGroup title="Hoje" items={groups.today} />
      <DeadlineGroup title="Esta semana" items={groups.week} />
      <DeadlineGroup title="Próximos" items={groups.upcoming} />
      {groups.withoutDate.length > 0 && <section style={{ padding: "var(--espaco-3) var(--espaco-4)", border: "1px solid var(--cor-borda-clara)", borderRadius: "var(--raio-medio)", backgroundColor: "var(--cor-superficie)" }}><div style={{ display: "flex", alignItems: "center", gap: "var(--espaco-2)", color: "var(--cor-texto-fraco)" }}><CircleAlert size={17} /><h2 style={{ fontSize: "var(--tamanho-base)", fontWeight: "var(--peso-semi)" }}>Etapas sem prazo</h2></div><p style={{ color: "var(--cor-texto-mudo)", fontSize: "var(--tamanho-base)" }}>{groups.withoutDate.map((item) => item.titulo).join(" · ")}</p></section>}
    </div>
  );
}