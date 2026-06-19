import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Search, FolderOpen, Users, Clock, ChevronRight, SlidersHorizontal, X, Plus } from "lucide-react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { projectService } from "../services/projectService";
import { courseService } from "../services/courseService";
import { StatusView } from "../components/StatusView";
import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import { getProjectSeatHolders, getProjectSlotsUsage, mapProject } from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import "./ProjectsPage.css";

function normalizeValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
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
      const result = await projectService.list({
        curso: selectedCourse === "Todos" ? "" : selectedCourse,
        area: selectedArea === "Todas" ? "" : selectedArea,
        status: selectedStatus === "Todos" ? "" : selectedStatus,
        busca: search,
      });
      const projects = Array.isArray(result) ? result.map(mapProject) : [];

      return Promise.all(
        projects.map(async (project) => {
          const collaborators = await projectService.getCollaborators(project.id).catch(() => null);
          if (!Array.isArray(collaborators)) return project;

          const slots = getProjectSlotsUsage(project, collaborators);

          return {
            ...project,
            collaborators,
            acceptedCollaborators: getProjectSeatHolders(project, collaborators),
            slotsUsed: slots.used,
            slotsRemaining: slots.remaining,
          };
        }),
      );
    },
    [selectedCourse, selectedArea, selectedStatus, search],
    { initialData: [] },
  );
  const projects = Array.isArray(data) ? data : [];

  const areas = ["Todas", ...(Array.isArray(areaNames) ? areaNames : [])];
  const cursos = ["Todos", ...(Array.isArray(courseNames) ? courseNames : [])];
  const statuses = ["Todos", "ABERTO", "EM_ANDAMENTO", "FINALIZADO"];

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        const term = search.toLowerCase();
        // Mantemos a busca no cliente também para cobrir descrição e tags,
        // já que a API foca apenas no título por padrão.
        return (
          project.title.toLowerCase().includes(term) ||
          project.description.toLowerCase().includes(term) ||
          project.tags.some((tag) => tag.toLowerCase().includes(term))
        );
      }),
    [projects, search],
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
          <h2 className="pagina-projetos__titulo">{filtered.length} projetos encontrados</h2>
          <p className="pagina-projetos__subtitulo">Encontre a oportunidade certa para sua carreira acadêmica</p>
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
            {(selectedArea !== "Todas" || selectedStatus !== "Todos") && (
              <span className="pagina-projetos__contador-filtros">
                {(selectedArea !== "Todas" ? 1 : 0) + (selectedStatus !== "Todos" ? 1 : 0)}
              </span>
            )}
          </motion.button>
        </div>
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
                <select
                  value={selectedCourse || "Todos"}
                  onChange={(e) => setSelectedCourse(e.target.value === "Todos" ? "" : e.target.value)}
                  className="pagina-projetos__input-filtro-curso"
                >
                  {cursos.map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
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
          {(selectedArea !== "Todas" || selectedStatus !== "Todos") && (
            <button
              onClick={() => {
                setSelectedArea("Todas");
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
                whileHover={{ scale: 1.03, boxShadow: "0 18px 30px rgba(37,99,235,0.14)" }}
                onClick={() => navigate(`/app/projects/${project.id}`)}
                className="projeto-card"
              >
                <div className="projeto-card__barra-topo" />
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
                      <div className="projeto-card__avatar-orientador">
                        <span className="projeto-card__iniciais-orientador">
                          {(project.advisor?.name ?? "IC").split(" ").slice(0, 2).map((part) => part[0]).join("")}
                        </span>
                      </div>
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
