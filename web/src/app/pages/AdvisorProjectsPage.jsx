import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Search,
  X,
  ChevronRight,
  UserCheck,
  UserX,
  Inbox,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { projectService } from "../services/projectService";
import { mapProject } from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

const ABAS = [
  { key: "todos", rotulo: "Todos" },
  { key: "solicitacoes", rotulo: "Solicitações de orientação" },
  { key: "ativos", rotulo: "Ativos" },
  { key: "finalizados", rotulo: "Finalizados" },
  { key: "explorar", rotulo: "Explorar" },
];

const STATUS_PILL = {
  PENDENTE_ORIENTADOR: "advisor-etiqueta--amarelo",
  ABERTO: "advisor-etiqueta--verde",
  EM_ANDAMENTO: "advisor-etiqueta--roxo",
  FINALIZADO: "advisor-etiqueta--cinza",
  REJEITADO_ORIENTADOR: "advisor-etiqueta--vermelho",
};

function statusPillClass(status) {
  return STATUS_PILL[status] ?? "advisor-etiqueta--cinza";
}

function ProjetoLinha({ project, tab, acaoLoading, onAbrir, onAceitar, onRecusar, onConfirmar }) {
  const confirmando = Boolean(acaoLoading?.id === project.id && acaoLoading?.acao);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="advisor-linha-card"
    >
      <div className="advisor-linha-card__icone">
        <FolderOpen size={20} />
      </div>

      <div className="advisor-linha-card__conteudo">
        <button type="button" className="advisor-linha-card__titulo-link" onClick={() => onAbrir(project)}>
          {project.title}
        </button>
        <p className="advisor-linha-card__meta">
          {project.area} · {project.slotsUsed}/{project.slots} vagas ·{" "}
          {project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "-"}
        </p>
        {project.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="advisor-etiqueta advisor-etiqueta--cinza">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="advisor-linha-card__acoes">
        <span className={`advisor-etiqueta ${statusPillClass(project.status)}`}>
          {formatProjectStatus(project.status)}
        </span>

        {tab === "solicitacoes" && project.status === "PENDENTE_ORIENTADOR" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {confirmando ? (
              <>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--sucesso"
                  disabled={acaoLoading?.aguardando}
                  onClick={() => onConfirmar(project, "aceitar")}
                >
                  {acaoLoading?.aguardando ? "Aguarde..." : "Confirmar aceite"}
                </button>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--secundario"
                  onClick={() => onConfirmar(project, null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--sucesso"
                  onClick={() => onAceitar(project)}
                >
                  <UserCheck size={16} />
                  Aceitar
                </button>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--perigo"
                  onClick={() => onRecusar(project)}
                >
                  <UserX size={16} />
                  Recusar
                </button>
              </>
            )}
          </div>
        )}

        <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => onAbrir(project)}>
          Abrir
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function EstadoVazio({ icone: Icone, titulo, descricao }) {
  return (
    <div className="advisor-estado-vazio">
      <div className="advisor-estado-vazio__icone">
        <Icone size={22} />
      </div>
      <h3 className="advisor-estado-vazio__titulo">{titulo}</h3>
      <p className="advisor-estado-vazio__descricao">{descricao}</p>
    </div>
  );
}

function ListaSkeleton({ linhas = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--cor-superficie)",
            borderRadius: "var(--raio-grande)",
            border: "1px solid var(--cor-borda-clara)",
            padding: "var(--espaco-4)",
            display: "flex",
            gap: "var(--espaco-4)",
            alignItems: "center",
          }}
        >
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "var(--raio-medio)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "45%", height: 16 }} />
            <div className="skeleton" style={{ width: "70%", height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdvisorProjectsPage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState("todos");
  const [busca, setBusca] = useState("");
  const [acaoLoading, setAcaoLoading] = useState(null);

  const isExplorar = aba === "explorar";

  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const raw = isExplorar
        ? await advisorService.explorar()
        : await advisorService.meusProjetos();
      return (Array.isArray(raw) ? raw : []).map(mapProject);
    },
    [aba],
    { initialData: [] },
  );

  const projetos = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const porStatus = projetos.filter((p) => {
      if (aba === "todos") return true;
      if (aba === "solicitacoes") return p.status === "PENDENTE_ORIENTADOR";
      if (aba === "ativos") return p.status === "ABERTO" || p.status === "EM_ANDAMENTO";
      if (aba === "finalizados") return p.status === "FINALIZADO";
      return true;
    });

    if (!termo) return porStatus;
    return porStatus.filter(
      (p) =>
        p.title.toLowerCase().includes(termo) ||
        p.description.toLowerCase().includes(termo) ||
        p.tags.some((t) => t.toLowerCase().includes(termo)),
    );
  }, [projetos, aba, busca, isExplorar]);

  const normError = error ? normalizeError(error) : null;

  useEffect(() => {
    setBusca("");
  }, [aba]);

  const handleAbrir = (project) => navigate(`/app/projects/${project.id}`);

  const handleSolicitarConfirmacao = (project, acao) => {
    setAcaoLoading({ id: project.id, acao });
  };

  const handleConfirmar = async (project, acao) => {
    if (!acao) {
      setAcaoLoading(null);
      return;
    }
    setAcaoLoading({ id: project.id, acao, aguardando: true });
    try {
      if (acao === "aceitar") {
        await projectService.acceptGuidance(project.id);
        toast.success("Projeto aceito. Ele agora está aberto para inscrições.");
      } else {
        await projectService.rejectGuidance(project.id);
        toast.success("Projeto recusado.");
      }
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível atualizar a solicitação."));
    } finally {
      setAcaoLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          {isExplorar ? "Descubra oportunidades" : "Acompanhe solicitações e vínculos"}
        </h2>
        <p className="advisor-hero__subtitulo">
          {isExplorar
            ? "Descubra projetos publicados na plataforma."
            : "Acompanhe os projetos sob sua orientação e as solicitações de orientação."}
        </p>
      </div>

      <div className="advisor-abas" role="tablist" aria-label="Abas de projetos">
        {ABAS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={aba === item.key}
            onClick={() => setAba(item.key)}
            className={`advisor-abas__botao ${aba === item.key ? "advisor-abas__botao--ativo" : ""}`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <div className="advisor-toolbar">
        <div className="advisor-busca">
          <Search size={16} className="advisor-busca__icone" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="advisor-busca__input"
            placeholder={isExplorar ? "Buscar projetos publicados..." : "Buscar nos seus projetos..."}
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--cor-texto-mudo)",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--raio-pequeno)",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading && <ListaSkeleton linhas={5} />}

      {!loading && normError && (
        <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normError)} />
      )}

      {!loading && !normError && projetosFiltrados.length === 0 && (
        <EstadoVazio
          icone={isExplorar ? Compass : Inbox}
          titulo={isExplorar ? "Nenhum projeto publicado encontrado" : "Nada por aqui ainda"}
          descricao={
            isExplorar
              ? "Nenhum projeto corresponde à busca no momento."
              : aba === "solicitacoes"
                ? "Nenhuma solicitação de orientação pendente. Propostas de alunos aparecerão aqui."
                : "Não há projetos nesta categoria. Explore as abas para navegar."
          }
        />
      )}

      {!loading && !normError && projetosFiltrados.length > 0 && (
        <div className="advisor-lista">
          {projetosFiltrados.map((project) => (
            <ProjetoLinha
              key={project.id}
              project={project}
              tab={aba}
              acaoLoading={acaoLoading}
              onAbrir={handleAbrir}
              onAceitar={() => handleSolicitarConfirmacao(project, "aceitar")}
              onRecusar={() => handleSolicitarConfirmacao(project, "recusar")}
              onConfirmar={(p, acao) => handleConfirmar(p, acao)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
