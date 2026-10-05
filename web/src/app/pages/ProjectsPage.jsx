import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { MagnifyingGlass, SlidersHorizontal, X, Plus } from "@phosphor-icons/react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { applicationService } from "../services/applicationService";
import { projectService } from "../services/projectService";
import { courseService } from "../services/courseService";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import ProjectGridCard from "../components/ProjectGridCard";
import { getUserId, mapApplication, mapProject } from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import "./ProjectsPage.css";

function normalizeValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toComparableId(value) {
  if (value == null) return "";
  return String(value).trim();
}

function isSameId(left, right) {
  const leftId = toComparableId(left);
  const rightId = toComparableId(right);
  return Boolean(leftId && rightId && leftId === rightId);
}

function hasCurrentUserInPeople(people, userId) {
  return Array.isArray(people) && people.some((person) => isSameId(getUserId(person), userId));
}

function canShowProjectForUser(project, user, approvedProjectIds) {
  if (project.status !== "FINALIZADO") return true;
  if (!user) return false;
  if (String(user.tipo ?? "").toUpperCase() === "ADMIN") return true;

  const userId = getUserId(user);
  return (
    isSameId(project.ownerId, userId) ||
    isSameId(project.advisorId, userId) ||
    approvedProjectIds.has(toComparableId(project.id)) ||
    hasCurrentUserInPeople(project.approvedParticipants, userId) ||
    hasCurrentUserInPeople(project.participants, userId) ||
    hasCurrentUserInPeople(project.acceptedCollaborators, userId)
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const handleOpenProject = useCallback((projectId) => navigate(`/app/projects/${projectId}`), [navigate]);
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const filterKey = `${selectedCourse}|${selectedArea}|${selectedStatus}|${debouncedSearch}`;
  const filterKeyRef = useRef(filterKey);
  filterKeyRef.current = filterKey;

  const { data: areaNames } = useAsyncData(
    async () => {
      const payload = await projectService.getStudyAreas().catch(() => []);
      const names = Array.isArray(payload) ? payload.map((a) => a?.nome).filter(Boolean) : [];
      return names;
    },
    [],
    { initialData: [] },
  );

  const { data: courseNames } = useAsyncData(
    async () => {
      const payload = await courseService.list().catch(() => []);
      const names = Array.isArray(payload) ? payload.map((c) => c?.nome).filter(Boolean) : [];
      return names;
    },
    [],
    { initialData: [] },
  );

  const { data, setData, loading, error } = useAsyncData(
    async ({ signal } = {}) => {
      const result = await projectService.listPaged({
        curso: selectedCourse === "Todos" ? "" : selectedCourse,
        area: selectedArea === "Todas" ? "" : selectedArea,
        status: selectedStatus === "Todos" ? "" : selectedStatus,
        busca: debouncedSearch,
      }, { signal, page: 0, size: 24 });
      return { ...result, content: result.content.map(mapProject) };
    },
    [selectedCourse, selectedArea, selectedStatus, debouncedSearch],
    { initialData: { content: [], page: 0, totalElements: 0, totalPages: 0, last: true } },
  );

  const loadMoreProjects = useCallback(async () => {
    if (loadingMore || loading || data?.last) return;
    const requestedFilterKey = filterKey;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const result = await projectService.listPaged({
        curso: selectedCourse === "Todos" ? "" : selectedCourse,
        area: selectedArea === "Todas" ? "" : selectedArea,
        status: selectedStatus === "Todos" ? "" : selectedStatus,
        busca: debouncedSearch,
      }, { page: (data?.page ?? 0) + 1, size: 24 });
      if (filterKeyRef.current !== requestedFilterKey) return;
      const nextPage = { ...result, content: result.content.map(mapProject) };
      setData((current) => ({
        ...nextPage,
        content: [...(current?.content ?? []), ...nextPage.content],
      }));
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, data, filterKey, selectedCourse, selectedArea, selectedStatus, debouncedSearch, setData]);

  const { data: myApplications } = useAsyncData(
    async () => {
      if (String(user?.tipo ?? "").toUpperCase() !== "ALUNO") return [];
      const result = await applicationService.listMine();
      return Array.isArray(result) ? result.map(mapApplication) : [];
    },
    [user?.id, user?.tipo],
    { initialData: [] },
  );

  const projects = Array.isArray(data?.content) ? data.content : [];
  const approvedProjectIds = useMemo(
    () => new Set(
      (Array.isArray(myApplications) ? myApplications : [])
        .filter((application) => application.status === "APROVADO")
        .map((application) => toComparableId(application.project?.id))
        .filter(Boolean),
    ),
    [myApplications],
  );
  const visibleProjects = useMemo(
    () => projects.filter((project) => canShowProjectForUser(project, user, approvedProjectIds)),
    [projects, user, approvedProjectIds],
  );

  const areas = ["Todas", ...(Array.isArray(areaNames) ? areaNames : [])];
  const cursos = ["Todos", ...(Array.isArray(courseNames) ? courseNames : [])];
  const statuses = ["Todos", "ABERTO", "EM_ANDAMENTO", "FINALIZADO"];
  const activeFiltersCount =
    (selectedArea !== "Todas" ? 1 : 0) +
    (selectedCourse ? 1 : 0) +
    (selectedStatus !== "Todos" ? 1 : 0);

  const filtered = useMemo(
    () =>
      visibleProjects.filter((project) => {
        const term = search.toLowerCase();
        // Mantemos a busca no cliente também para cobrir descrição e tags,
        // já que a API foca apenas no título por padrão.
        return (
          project.title.toLowerCase().includes(term) ||
          project.description.toLowerCase().includes(term) ||
          project.tags.some((tag) => tag.toLowerCase().includes(term))
        );
      }),
    [visibleProjects, search],
  );

  const counts = useMemo(
    () => ({
      total: visibleProjects.length,
      open: visibleProjects.filter((project) => project.status === "ABERTO").length,
      active: visibleProjects.filter((project) => project.status === "EM_ANDAMENTO").length,
      finished: visibleProjects.filter((project) => project.status === "FINALIZADO").length,
    }),
    [visibleProjects],
  );

  if (error) {
    return <StatusView title="Falha ao carregar projetos" description={error.message} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pagina-projetos"
    >
      <div className="pagina-projetos__cabecalho">
        <div>
          <h2 className="pagina-projetos__titulo">
            {loading ? <span className="skeleton pagina-projetos__titulo-skeleton" /> : `${filtered.length} projetos carregados`}
          </h2>
          <p className="pagina-projetos__subtitulo">Explore projetos abertos, acompanhe vinculados e mantenha finalizados como histórico de consulta.</p>
        </div>
        <div className="pagina-projetos__acoes-cabecalho">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/app/projects/new")}
            className="pagina-projetos__botao-novo"
          >
            <Plus size={16} />
            Novo projeto
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`pagina-projetos__botao-filtros ${showFilters ? "pagina-projetos__botao-filtros--ativo" : "pagina-projetos__botao-filtros--inativo"}`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="pagina-projetos__contador-filtros">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="pagina-projetos__resumo-historico">
        {[
          ["Todos", "Todos", counts.total],
          ["ABERTO", "Abertos", counts.open],
          ["EM_ANDAMENTO", "Em andamento", counts.active],
          ["FINALIZADO", "Finalizados", counts.finished],
        ].map(([status, label, count]) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`pagina-projetos__atalho-status ${selectedStatus === status ? "pagina-projetos__atalho-status--ativo" : ""}`}
          >
            <span className="pagina-projetos__atalho-status-valor">{loading ? "–" : count}</span>
            <span className="pagina-projetos__atalho-status-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="pagina-projetos__busca">
        <MagnifyingGlass size={18} className="pagina-projetos__icone-busca" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pagina-projetos__input-busca"
          placeholder="Buscar projetos por título, área ou tecnologia..."
        />
        {search && (
          <button onClick={() => setSearch("")} className="pagina-projetos__botao-limpar-busca">
            <X size={16} />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="pagina-projetos__painel-filtros">
          <div className="pagina-projetos__grade-filtros">
            <div>
              <label className="pagina-projetos__rotulo-filtro">Área de pesquisa</label>
              <div className="pagina-projetos__chips-filtro">
                {areas.map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`pagina-projetos__chip ${selectedArea === area ? "pagina-projetos__chip--ativo" : "pagina-projetos__chip--inativo"}`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="pagina-projetos__rotulo-filtro">Curso</label>
              <div className="pagina-projetos__input-filtro">
                <AppCombobox
                  ariaLabel="Filtrar por curso"
                  className="pagina-projetos__input-filtro-curso"
                  value={selectedCourse || "Todos"}
                  onChange={(nextValue) => setSelectedCourse(nextValue === "Todos" ? "" : nextValue)}
                  options={cursos.map((curso) => ({ value: curso, label: curso }))}
                />
              </div>
            </div>
            <div>
              <label className="pagina-projetos__rotulo-filtro">Status</label>
              <div className="pagina-projetos__chips-filtro">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`pagina-projetos__chip ${selectedStatus === status ? "pagina-projetos__chip--ativo" : "pagina-projetos__chip--inativo"}`}
                  >
                    {status === "Todos" ? "Todos" : formatProjectStatus(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSelectedArea("Todas");
                setSelectedCourse("");
                setSelectedStatus("Todos");
              }}
              className="pagina-projetos__botao-limpar-filtros"
            >
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {!showFilters && (
        <div className="pagina-projetos__filtros-rapidos">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`pagina-projetos__filtro-area ${selectedArea === area ? "pagina-projetos__filtro-area--ativo" : "pagina-projetos__filtro-area--inativo"}`}
            >
              {area}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="pagina-projetos__grade">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} index={i} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="pagina-projetos__estado-vazio">
          <div className="pagina-projetos__icone-vazio">
            <MagnifyingGlass size={24} style={{ color: "var(--cor-texto-mudo)" }} />
          </div>
          <h3 className="pagina-projetos__titulo-vazio">Nenhum projeto encontrado</h3>
          <p className="pagina-projetos__descricao-vazio">Tente ajustar os filtros ou o termo de busca.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="pagina-projetos__grade">
            {filtered.map((project, index) => (
              <ProjectGridCard key={project.id} project={project} index={index} onOpen={handleOpenProject} />
            ))}
          </div>
        </>
      )}
      {!loading && !data?.last && (
        <button
          type="button"
          className="pagina-projetos__botao-carregar-mais"
          onClick={loadMoreProjects}
          disabled={loadingMore}
          aria-label="Carregar mais projetos"
        >
          {loadingMore ? "Carregando..." : loadMoreError ? "Tentar novamente" : "Carregar mais projetos"}
        </button>
      )}
    </motion.div>
  );
}
