import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Envelope, Hash, BookOpen, CaretRight, FolderOpen } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientandoDetalhe } from "../utils/adapters";
import { formatProjectStatus, formatDate } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AdvisorMarcoCard } from "../components/progress/AdvisorMarcoCard";
import { FiltrosMarco } from "../components/progress/MarcoPartes";
import { marcosApi } from "../components/progress/marcosApi";
import { useMarcos } from "../components/progress/useMarcos";
import { contarFiltros, filtrarMarcos, mensagemDeErro } from "../components/progress/marcoUtils";
import "./AdvisorWorkspace.css";

function situacaoPillClass(situacao) {
  if (situacao === "EM_ANDAMENTO") return "advisor-etiqueta--amarelo";
  if (situacao === "ABERTO") return "advisor-etiqueta--verde";
  if (situacao === "FINALIZADO") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--vermelho";
}

function iniciais(nome = "") {
  return String(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function AvatarPerfil({ nome, src }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div className="advisor-perfil-cartao__avatar">
      {showPhoto ? <img src={src} alt={`Foto de perfil de ${nome}`} onError={() => setFailed(true)} /> : iniciais(nome)}
    </div>
  );
}
// Marcos do projeto do orientando: checklist (inclusive tarefas pessoais) somente leitura
// e revisão (aprovar/devolver). A edição de marcos e tarefas fica em /app/progress.
function MarcosDoOrientando({ projetoId, finalizado, onGerenciar }) {
  const { marcos, loading, error, recarregar, executar } = useMarcos(projetoId);
  const [filtro, setFiltro] = useState("todos");
  const contagem = useMemo(() => contarFiltros(marcos), [marcos]);
  const filtrados = useMemo(() => filtrarMarcos(marcos, filtro), [marcos, filtro]);

  const acoes = useMemo(() => {
    const historico = (marco) => marcosApi.listRevisoes(projetoId, marco.id);
    if (finalizado) return { historico };
    return {
      historico,
      revisar: async (marco, dados) => {
        await executar(() => marcosApi.reviewMarco(projetoId, marco.id, dados));
        toast.success(dados.acao === "APROVAR" ? "Marco aprovado." : "Marco devolvido ao aluno.");
      },
    };
  }, [executar, finalizado, projetoId]);

  return (
    <div className="advisor-card-conteudo">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
          Marcos {marcos.length > 0 && `(${marcos.length})`}
        </p>
        {projetoId ? (
          <button type="button" className="advisor-botao advisor-botao--secundario advisor-botao--pequeno" onClick={onGerenciar}>
            Gerenciar marcos e tarefas
          </button>
        ) : null}
      </div>

      {marcos.length > 0 && <FiltrosMarco valor={filtro} onChange={setFiltro} contagens={contagem} />}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }} aria-busy="true" aria-label="Carregando marcos">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 96, borderRadius: "var(--raio-medio)" }} />
          ))}
        </div>
      )}
      {!loading && error && (
        <p className="advisor-campo__erro" role="alert">
          {mensagemDeErro(error, "Não foi possível carregar os marcos.")}{" "}
          <button type="button" className="advisor-etapa__botao-link" onClick={() => recarregar()}>Tentar novamente</button>
        </p>
      )}
      {!loading && !error && marcos.length === 0 && (
        <p className="advisor-linha-card__meta">Nenhum marco definido para este projeto ainda.</p>
      )}
      {!loading && !error && marcos.length > 0 && filtrados.length === 0 && (
        <p className="advisor-linha-card__meta">Nenhum marco neste filtro.</p>
      )}
      {!loading && !error && filtrados.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
          {filtrados.map((marco) => (
            <AdvisorMarcoCard key={marco.id} marco={marco} indice={marcos.indexOf(marco) + 1} acoes={acoes} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetalheSkeleton() {
  return (
    <div className="advisor-pagina">
      <div className="skeleton" style={{ width: 140, height: 18 }} />
      <div className="advisor-detalhe-grade" style={{ marginTop: "var(--espaco-4)" }}>
        <div className="advisor-detalhe-lateral">
          <div className="skeleton" style={{ width: "100%", height: 220, borderRadius: "var(--raio-grande)" }} />
          <div className="skeleton" style={{ width: "100%", height: 90, borderRadius: "var(--raio-grande)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-4)" }}>
          <div className="skeleton" style={{ width: "100%", height: 110, borderRadius: "var(--raio-grande)" }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 76, borderRadius: "var(--raio-medio)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdvisorAdviseeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(null);

  const { data, loading, error } = useAsyncData(
    async () => {
      const raw = await advisorService.detalheOrientando(id, projectId ?? undefined);
      return mapOrientandoDetalhe(raw);
    },
    [id, projectId],
    { initialData: null },
  );

  const normError = error ? normalizeError(error) : null;

  if (loading) return <DetalheSkeleton />;

  if (normError || !data) {
    return (
      <StatusView
        title="Não foi possível carregar o orientando"
        description={getErrorMessage(normError, "Orientando não encontrado.")}
        action={
          <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => navigate("/app/advisees")}>
            Voltar aos orientandos
          </button>
        }
      />
    );
  }

  const projetoAtivoId = projectId ?? data.projetoSelecionado?.projetoId ?? data.projetos[0]?.projetoId ?? null;

  const handleTrocarProjeto = (novoId) => {
    if (novoId !== projectId) {
      setProjectId(novoId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <button type="button" className="advisor-etapa__botao-link" onClick={() => navigate("/app/advisees")}>
        <ArrowLeft size={16} />
        Voltar aos orientandos
      </button>

      <div className="advisor-detalhe-grade">
        <div className="advisor-detalhe-lateral">
          <div className="advisor-perfil-cartao">
            <AvatarPerfil nome={data.nome} src={data.fotoPerfilUrl || data.avatarUrl} />
            <h3 className="advisor-perfil-cartao__nome">{data.nome}</h3>
            <span className={`advisor-etiqueta ${situacaoPillClass(data.projetoSelecionado?.status ?? data.projetos[0]?.status ?? "INATIVO")}`}>
              {formatProjectStatus(data.projetoSelecionado?.status ?? data.projetos[0]?.status ?? "INATIVO")}
            </span>
            <div className="advisor-perfil-cartao__info">
              {data.email && (
                <div className="advisor-perfil-cartao__info-item">
                  <Envelope size={14} className="advisor-perfil-cartao__info-icone" />
                  {data.email}
                </div>
              )}
              {data.ra && (
                <div className="advisor-perfil-cartao__info-item">
                  <Hash size={14} className="advisor-perfil-cartao__info-icone" />
                  RA {data.ra}
                </div>
              )}
              {data.curso && (
                <div className="advisor-perfil-cartao__info-item">
                  <BookOpen size={14} className="advisor-perfil-cartao__info-icone" />
                  {data.curso}
                </div>
              )}
            </div>
          </div>

          {data.projetos.length > 1 && (
            <div className="advisor-card-conteudo" style={{ padding: "var(--espaco-4)" }}>
              <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
                Projetos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-2)" }}>
                {data.projetos.map((p) => (
                  <button
                    key={p.projetoId}
                    type="button"
                    onClick={() => handleTrocarProjeto(p.projetoId)}
                    className="advisor-etapa__botao-link"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "var(--espaco-2)",
                      borderRadius: "var(--raio-medio)",
                      width: "100%",
                      background: p.projetoId === projetoAtivoId ? "var(--cor-primaria-clara)" : "var(--cor-fundo-leve)",
                      color: p.projetoId === projetoAtivoId ? "var(--cor-primaria-texto)" : "var(--cor-texto-medio)",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.projetoTitulo}</span>
                    <CaretRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-4)", minWidth: 0 }}>
          <div className="advisor-card-conteudo">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
                {data.projetoSelecionado?.projetoTitulo ?? data.projetos.find((p) => p.projetoId === projetoAtivoId)?.projetoTitulo ?? "Projeto"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="advisor-percentual">{data.progresso}%</span>
                <div className="advisor-barra-progresso" style={{ width: 140 }}>
                  <div className="advisor-barra-progresso__preenchimento" style={{ width: `${Math.min(100, Math.max(0, data.progresso))}%` }} />
                </div>
              </div>
            </div>
            <p className="advisor-linha-card__meta" style={{ marginTop: 4 }}>
              <FolderOpen size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
              Progresso geral no projeto selecionado.
            </p>
          </div>

          <MarcosDoOrientando
            key={projetoAtivoId}
            projetoId={projetoAtivoId}
            finalizado={(data.projetoSelecionado?.status ?? data.projetos.find((p) => p.projetoId === projetoAtivoId)?.status) === "FINALIZADO"}
            onGerenciar={() => navigate(`/app/progress?projectId=${projetoAtivoId}`)}
          />

          <div className="advisor-card-conteudo">
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Atualizações do aluno {data.historico.length > 0 && `(${data.historico.length})`}
            </p>
            {data.historico.length === 0 && (
              <p className="advisor-linha-card__meta">O aluno ainda não registrou atualizações neste projeto.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
              {data.historico.slice(0, 10).map((item) => (
                <div key={item.id ?? item.titulo} className="advisor-etapa">
                  <div className="advisor-etapa__cabecalho">
                    <p className="advisor-etapa__titulo">{item.titulo}</p>
                    {item.dataRegistro && <span className="advisor-etapa__meta">{formatDate(item.dataRegistro)}</span>}
                  </div>
                  {item.descricao && <p className="advisor-etapa__descricao">{item.descricao}</p>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}


