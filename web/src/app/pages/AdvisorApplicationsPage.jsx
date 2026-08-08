import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Inbox, Check, X, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { applicationService } from "../services/applicationService";
import { mapAdvisorApplication } from "../utils/adapters";
import { formatApplicationStatus, formatDate } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

const FILTROS = [
  { key: "todas", rotulo: "Todas" },
  { key: "PENDENTE", rotulo: "Pendentes" },
  { key: "APROVADO", rotulo: "Aprovadas" },
  { key: "REJEITADO", rotulo: "Rejeitadas" },
];

function statusPillClass(status) {
  if (status === "PENDENTE") return "advisor-etiqueta--amarelo";
  if (status === "APROVADO") return "advisor-etiqueta--verde";
  if (status === "REJEITADO") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--cinza";
}

function SkeletonLinha({ linhas = 5 }) {
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
          }}
        >
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "var(--raio-completo)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "40%", height: 15 }} />
            <div className="skeleton" style={{ width: "65%", height: 12 }} />
            <div className="skeleton" style={{ width: "50%", height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EstadoVazio({ titulo, descricao }) {
  return (
    <div className="advisor-estado-vazio">
      <div className="advisor-estado-vazio__icone">
        <Inbox size={22} />
      </div>
      <h3 className="advisor-estado-vazio__titulo">{titulo}</h3>
      <p className="advisor-estado-vazio__descricao">{descricao}</p>
    </div>
  );
}

export default function AdvisorApplicationsPage() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("todas");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [modal, setModal] = useState(null);
  const [parecer, setParecer] = useState("");
  const [acaoLoadingId, setAcaoLoadingId] = useState(null);

  const { data, loading, error, setData } = useAsyncData(
    async () => {
      const raw = await advisorService.inscricoes();
      return (Array.isArray(raw) ? raw : []).map(mapAdvisorApplication);
    },
    [],
    { initialData: [] },
  );

  const inscricoes = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return inscricoes;
    return inscricoes.filter((app) => app.status === filtro);
  }, [inscricoes, filtro]);

  const counts = useMemo(
    () => ({
      todas: inscricoes.length,
      PENDENTE: inscricoes.filter((a) => a.status === "PENDENTE").length,
      APROVADO: inscricoes.filter((a) => a.status === "APROVADO").length,
      REJEITADO: inscricoes.filter((a) => a.status === "REJEITADO").length,
    }),
    [inscricoes],
  );

  const toggleMotivacao = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openModal = (type, app) => {
    setModal({ type, app });
    setParecer("");
  };

  const closeModal = () => {
    setModal(null);
    setParecer("");
  };

  const submitModal = async () => {
    if (!modal) return;
    const { type, app } = modal;
    const texto = parecer.trim();
    setAcaoLoadingId(app.id);
    try {
      if (type === "aprovar") {
        await applicationService.approve(app.id, texto);
        toast.success("Inscrição aprovada.");
      } else {
        await applicationService.reject(app.id, texto);
        toast.success("Inscrição rejeitada.");
      }
      setData((prev) => (Array.isArray(prev) ? prev.filter((a) => a.id !== app.id) : prev));
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível concluir a ação."));
    } finally {
      setAcaoLoadingId(null);
    }
  };

  const normError = error ? normalizeError(error) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Inscrições recebidas
        </h2>
        <p className="advisor-hero__subtitulo">
          Revise as inscrições dos alunos nos seus projetos e aprove ou rejeite com um parecer.
        </p>
      </div>

      <div className="advisor-abas" role="tablist" aria-label="Filtro de inscrições">
        {FILTROS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={filtro === item.key}
            onClick={() => setFiltro(item.key)}
            className={`advisor-abas__botao ${filtro === item.key ? "advisor-abas__botao--ativo" : ""}`}
          >
            {item.rotulo} ({counts[item.key] ?? 0})
          </button>
        ))}
      </div>

      {loading && <SkeletonLinha linhas={5} />}

      {!loading && normError && (
        <StatusView title="Falha ao carregar inscrições" description={getErrorMessage(normError)} />
      )}

      {!loading && !normError && filtradas.length === 0 && (
        <EstadoVazio
          titulo="Nenhuma inscrição encontrada"
          descricao="Quando um aluno se inscrever nos seus projetos, as inscrições aparecerão aqui."
        />
      )}

      {!loading && !normError && filtradas.length > 0 && (
        <div className="advisor-lista">
          {filtradas.map((app, index) => {
            const expandida = expandedIds.has(app.id);
            const carregando = acaoLoadingId === app.id;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="advisor-linha-card"
              >
                <div className="advisor-linha-card__icone" style={{ borderRadius: "var(--raio-completo)" }}>
                  <span style={{ fontSize: "var(--tamanho-normal)", fontWeight: 700 }}>
                    {String(app.alunoNome ?? "?")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>

                <div className="advisor-linha-card__conteudo">
                  <p className="advisor-linha-card__titulo">{app.alunoNome}</p>
                  <p className="advisor-linha-card__meta">
                    <strong>{app.projetoTitulo}</strong> · {formatDate(app.appliedAt)}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    <span className={`advisor-etiqueta ${statusPillClass(app.status)}`}>
                      {formatApplicationStatus(app.status)}
                    </span>
                    {app.motivacao && (
                      <button
                        type="button"
                        onClick={() => toggleMotivacao(app.id)}
                        className="advisor-etapa__botao-link"
                        style={{ fontSize: "var(--tamanho-pequeno)" }}
                      >
                        <FileText size={14} />
                        {expandida ? "Ocultar motivação" : "Ver motivação"}
                      </button>
                    )}
                  </div>
                  {expandida && app.motivacao && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      style={{ marginTop: 8, fontSize: "var(--tamanho-base)", color: "var(--cor-texto-fraco)", lineHeight: 1.6 }}
                    >
                      {app.motivacao}
                    </motion.p>
                  )}
                </div>

                <div className="advisor-linha-card__acoes">
                  {app.status === "PENDENTE" && (
                    <>
                      <button
                        type="button"
                        className="advisor-botao advisor-botao--sucesso"
                        disabled={carregando}
                        onClick={() => openModal("aprovar", app)}
                      >
                        <Check size={16} />
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="advisor-botao advisor-botao--perigo"
                        disabled={carregando}
                        onClick={() => openModal("rejeitar", app)}
                      >
                        <X size={16} />
                        Rejeitar
                      </button>
                    </>
                  )}
                  {app.parecerOrientador && (
                    <span className="advisor-etiqueta advisor-etiqueta--cinza" title="Parecer do orientador">
                      Com parecer
                    </span>
                  )}
                  {app.projetoId && (
                    <button
                      type="button"
                      className="advisor-botao advisor-botao--secundario"
                      onClick={() => navigate(`/app/projects/${app.projetoId}`)}
                    >
                      Projeto
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Decidir inscrição">
          <div className="advisor-modal">
            <div className="advisor-modal__cabecalho">
              <div>
                <h3 className="advisor-modal__titulo">
                  {modal.type === "aprovar" ? "Aprovar inscrição" : "Rejeitar inscrição"}
                </h3>
                <p className="advisor-modal__descricao" style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-fraco)", marginTop: 4 }}>
                  {modal.app.alunoNome} · {modal.app.projetoTitulo}
                </p>
              </div>
              <button type="button" className="advisor-modal__fechar" onClick={closeModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="advisor-modal__corpo">
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="parecer-orientador">
                  Parecer do orientador <span style={{ fontWeight: 400, color: "var(--cor-texto-mudo)" }}>(opcional)</span>
                </label>
                <textarea
                  id="parecer-orientador"
                  value={parecer}
                  onChange={(e) => setParecer(e.target.value)}
                  rows={4}
                  className="advisor-campo__input"
                  placeholder="Escreva um comentário para o aluno (opcional)..."
                />
              </div>
            </div>

            <div className="advisor-modal__rodape">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="button"
                className={`advisor-botao ${modal.type === "aprovar" ? "advisor-botao--sucesso" : "advisor-botao--perigo"}`}
                disabled={acaoLoadingId === modal.app.id}
                onClick={submitModal}
              >
                {acaoLoadingId === modal.app.id ? "Aguarde..." : modal.type === "aprovar" ? "Aprovar inscrição" : "Rejeitar inscrição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
