import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Hash, BookOpen, ChevronRight, Clock, CheckCircle2, FolderOpen } from "lucide-react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientandoDetalhe } from "../utils/adapters";
import {
  formatProjectStatus,
  formatEtapaStatus,
  formatEtapaResponsavel,
  formatDate,
} from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

function situacaoPillClass(situacao) {
  if (situacao === "EM_ANDAMENTO") return "advisor-etiqueta--amarelo";
  if (situacao === "ABERTO") return "advisor-etiqueta--verde";
  if (situacao === "FINALIZADO") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--vermelho";
}

function statusEtapaClass(status) {
  if (status === "DONE") return "advisor-etiqueta--verde";
  if (status === "ACTIVE") return "advisor-etiqueta--amarelo";
  if (status === "REJECTED") return "advisor-etiqueta--vermelho";
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
                  <Mail size={14} className="advisor-perfil-cartao__info-icone" />
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
                    <ChevronRight size={14} />
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

          <div className="advisor-card-conteudo">
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Etapas {data.etapas.length > 0 && `(${data.etapas.length})`}
            </p>
            {data.etapas.length === 0 && (
              <p className="advisor-linha-card__meta">Nenhuma etapa definida para este projeto ainda.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
              {data.etapas.map((etapa) => (
                <div key={etapa.id ?? etapa.titulo} className="advisor-etapa">
                  <div className="advisor-etapa__cabecalho">
                    <p className="advisor-etapa__titulo">{etapa.titulo}</p>
                    <span className={`advisor-etiqueta ${statusEtapaClass(etapa.status)}`}>
                      {formatEtapaStatus(etapa.status)}
                    </span>
                  </div>
                  {etapa.descricao && <p className="advisor-etapa__descricao">{etapa.descricao}</p>}
                  <div className="advisor-etapa__meta">
                    <span>Responsável: {formatEtapaResponsavel(etapa.responsavel)}</span>
                    {etapa.prazo && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> Prazo: {formatDate(etapa.prazo)}
                      </span>
                    )}
                    {etapa.concluidaEm && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={12} /> Concluída em {formatDate(etapa.concluidaEm)}
                        {etapa.concluidaPorNome ? ` por ${etapa.concluidaPorNome}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}


