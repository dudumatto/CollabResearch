import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Search, FolderOpen, Users, Clock, ChevronRight, SlidersHorizontal, X, Plus } from "lucide-react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { applicationService } from "../services/applicationService";
import { projectService } from "../services/projectService";
import { courseService } from "../services/courseService";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import { getProjectSlotsUsage, getUserId, getUserPhotoUrl, mapApplication, mapProject } from "../utils/adapters";
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

function AdvisorAvatar({ advisor }) {
  const photoUrl = getUserPhotoUrl(advisor);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <div className="projeto-card__avatar-orientador">
      {showPhoto ? (
        <img src={photoUrl} alt={`Foto de perfil de ${advisor?.name ?? "orientador"}`} onError={() => setFailed(true)} />
      ) : (
        <span className="projeto-card__iniciais-orientador">
          {(advisor?.name ?? "IC").split(" ").slice(0, 2).map((part) => part[0]).join("")}
        </span>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);

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

  const { data, loading, error } = useAsyncData(
    async () => {
      const result = await projectService.listPaged({
        curso: selectedCourse === "Todos" ? "" : selectedCourse,
        area: selectedArea === "Todas" ? "" : selectedArea,
        status: selectedStatus === "Todos" ? "" : selectedStatus,
        busca: debouncedSearch,
      });
      return Array.isArray(result) ? result.map(mapProject) : [];
    },
    [selectedCourse, selectedArea, selectedStatus, debouncedSearch],
    { initialData: [] },
  );

  const { data: myApplications } = useAsyncData(
    async () => {
      if (String(user?.tipo ?? "").toUpperCase() !== "ALUNO") return [];
      const result = await applicationService.listMine();
      return Array.isArray(result) ? result.map(mapApplication) : [];
    },
    [user?.id, user?.tipo],
    { initialData: [] },
  );

  const projects = Array.isArray(data) ? data : [];
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
      active: visibleProjects.filter((project) => project.status !== "FINALIZADO").length,
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
          <h2 className="pagina-projetos__titulo">{filtered.length} projetos disponíveis</h2>
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
          ["EM_ANDAMENTO", "Em andamento", counts.active],
          ["FINALIZADO", "Finalizados", counts.finished],
        ].map(([status, label, count]) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`pagina-projetos__atalho-status ${selectedStatus === status ? "pagina-projetos__atalho-status--ativo" : ""}`}
          >
            <span className="pagina-projetos__atalho-status-valor">{count}</span>
            <span className="pagina-projetos__atalho-status-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="pagina-projetos__busca">
        <Search size={18} className="pagina-projetos__icone-busca" />
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
            <Search size={24} style={{ color: "var(--cor-texto-mudo)" }} />
          </div>
          <h3 className="pagina-projetos__titulo-vazio">Nenhum projeto encontrado</h3>
          <p className="pagina-projetos__descricao-vazio">Tente ajustar os filtros ou o termo de busca.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="pagina-projetos__grade">
          {filtered.map((project, index) => {
            const slots = getProjectSlotsUsage(project);
            const isFull = slots.remaining <= 0;
            const statusClass = project.status === "FINALIZADO"
              ? "projeto-card__status--encerrado"
              : project.status === "EM_ANDAMENTO"
                ? "projeto-card__status--andamento"
                : isFull
                  ? "projeto-card__status--encerrado"
                  : "projeto-card__status--aberto";

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ y: -2, boxShadow: "0 18px 30px rgba(37,99,235,0.14)" }}
                onClick={() => navigate(`/app/projects/${project.id}`)}
                className="projeto-card"
              >
                <div className="projeto-card__corpo">
                  <div className="projeto-card__cabecalho">
                    <span className={`projeto-card__status ${statusClass}`}>
                      {isFull && project.status === "ABERTO" ? "Cheio" : formatProjectStatus(project.status)}
                    </span>
                  </div>

                  <h3 className="projeto-card__titulo">{project.title}</h3>
                  <p className="projeto-card__descricao">{project.description}</p>

                  <div className="projeto-card__tags">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="projeto-card__etiqueta">{tag}</span>
                    ))}
                  </div>

                  <div className="projeto-card__informacoes">
                    <div className="projeto-card__info-item">
                      <div className="projeto-card__info-icone"><Users size={12} /></div>
                      <p className="projeto-card__info-valor">{`${slots.used} / ${slots.total}`}</p>
                      <p className="projeto-card__info-rotulo">vagas ocupadas</p>
                    </div>
                    <div className="projeto-card__info-item">
                      <div className="projeto-card__info-icone"><Clock size={12} /></div>
                      <p className="projeto-card__info-valor">{project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "-"}</p>
                      <p className="projeto-card__info-rotulo">publicado</p>
                    </div>
                    <div className="projeto-card__info-item">
                      <div className="projeto-card__info-icone"><FolderOpen size={12} /></div>
                      <p className="projeto-card__info-valor">{project.area}</p>
                      <p className="projeto-card__info-rotulo">área</p>
                    </div>
                  </div>

                  <div className="projeto-card__orientador">
                    <div className="projeto-card__orientador-dados">
                      <AdvisorAvatar advisor={project.advisor} />
                      <span className="projeto-card__nome-orientador">
                        {project.advisor?.name ? `${project.advisor.name} (orientador)` : "Sem orientador"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="projeto-card__seta-acesso" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
