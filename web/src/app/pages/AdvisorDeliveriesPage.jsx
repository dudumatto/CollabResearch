import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router";
import { FolderOpen, ChevronDown, ChevronRight, Download, FileArchive, CheckCircle2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { deliveryService } from "../services/deliveryService";
import { api } from "../services/api";
import { mapProject, mapEntrega, mapDeliveryVersion } from "../utils/adapters";
import { formatEntregaStatus, formatEntregaDecisao, formatDate } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const FILTROS = [
  { key: "todas", rotulo: "Todas" },
  { key: "PENDING_REVIEW", rotulo: "Aguardando revisão" },
  { key: "CHANGES_REQUESTED", rotulo: "Ajustes solicitados" },
  { key: "APPROVED", rotulo: "Aprovadas" },
];

function entregaPillClass(status) {
  if (status === "PENDING_REVIEW") return "advisor-etiqueta--amarelo";
  if (status === "CHANGES_REQUESTED") return "advisor-etiqueta--laranja";
  if (status === "APPROVED") return "advisor-etiqueta--verde";
  return "advisor-etiqueta--cinza";
}

function formatarTamanho(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Skeleton({ linhas = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: "100%", height: 84, borderRadius: "var(--raio-grande)" }} />
      ))}
    </div>
  );
}

export default function AdvisorDeliveriesPage() {
  const location = useLocation();
  const queryProjectId = new URLSearchParams(location.search).get("projectId");
  const [projectId, setProjectId] = useState(queryProjectId ? Number(queryProjectId) : null);
  const [filtro, setFiltro] = useState("todas");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [versoesPorEntrega, setVersoesPorEntrega] = useState({});
  const [versoesLoading, setVersoesLoading] = useState({});
  const [versoesErro, setVersoesErro] = useState({});
  const [modal, setModal] = useState(null);
  const [decisao, setDecisao] = useState("");
  const [comentario, setComentario] = useState("");
  const [erroForm, setErroForm] = useState("");
  const [revisando, setRevisando] = useState(false);

  const { data: projetos, loading: loadingProjetos, error: erroProjetos } = useAsyncData(
    async () => {
      const raw = await advisorService.meusProjetos();
      return (Array.isArray(raw) ? raw : []).map(mapProject);
    },
    [],
    { initialData: [] },
  );

  const todosProjetos = useMemo(() => (Array.isArray(projetos) ? projetos : []), [projetos]);
  useEffect(() => {
    if (queryProjectId) setProjectId(Number(queryProjectId));
  }, [queryProjectId]);
  const activeProjectId = projectId ?? todosProjetos[0]?.id ?? null;

  const { data: entregas, loading: loadingEntregas, error: erroEntregas, reload } = useAsyncData(
    async () => {
      if (!activeProjectId) return [];
      const raw = await deliveryService.list(activeProjectId);
      return (Array.isArray(raw) ? raw : []).map(mapEntrega);
    },
    [activeProjectId],
    { initialData: [] },
  );

  const listaEntregas = useMemo(() => (Array.isArray(entregas) ? entregas : []), [entregas]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return listaEntregas;
    return listaEntregas.filter((e) => e.status === filtro);
  }, [listaEntregas, filtro]);

  const normErroProjetos = erroProjetos ? normalizeError(erroProjetos) : null;
  const normErroEntregas = erroEntregas ? normalizeError(erroEntregas) : null;

  const toggleExpandir = async (entrega) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entrega.id)) next.delete(entrega.id);
      else next.add(entrega.id);
      return next;
    });
    if (!expandedIds.has(entrega.id) && !versoesPorEntrega[entrega.id] && !versoesLoading[entrega.id]) {
      setVersoesLoading((prev) => ({ ...prev, [entrega.id]: true }));
      setVersoesErro((prev) => ({ ...prev, [entrega.id]: null }));
      try {
        const raw = await deliveryService.listVersions(activeProjectId, entrega.id);
        const versoes = (Array.isArray(raw) ? raw : []).map(mapDeliveryVersion);
        setVersoesPorEntrega((prev) => ({ ...prev, [entrega.id]: versoes }));
      } catch (err) {
        setVersoesErro((prev) => ({ ...prev, [entrega.id]: err }));
      } finally {
        setVersoesLoading((prev) => ({ ...prev, [entrega.id]: false }));
      }
    }
  };

  const baixar = async (entrega, versao) => {
    try {
      const blob = await api.getBlob(deliveryService.downloadUrl(activeProjectId, entrega.id, versao.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = versao.nomeArquivo || "entrega";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível baixar o arquivo."));
    }
  };

  const abrirRevisao = (entrega, versao) => {
    setModal({ entrega, versao });
    setDecisao("");
    setComentario("");
    setErroForm("");
  };

  const fecharRevisao = () => {
    setModal(null);
    setDecisao("");
    setComentario("");
    setErroForm("");
  };

  const enviarRevisao = async () => {
    if (!modal) return;
    if (!decisao) {
      setErroForm("Escolha uma decisão: aprovar ou solicitar ajustes.");
      return;
    }
    if (decisao === "CHANGES_REQUESTED" && !comentario.trim()) {
      setErroForm("Ao solicitar ajustes, é obrigatório informar um comentário.");
      return;
    }
    setRevisando(true);
    try {
      await deliveryService.review(activeProjectId, modal.entrega.id, modal.versao.id, {
        decisao,
        comentario: comentario.trim(),
      });
      toast.success(decisao === "APPROVED" ? "Entrega aprovada." : "Ajustes solicitados ao aluno.");
      fecharRevisao();
      setVersoesPorEntrega({});
      setExpandedIds(new Set());
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível registrar a revisão."));
    } finally {
      setRevisando(false);
    }
  };

  if (loadingProjetos) return <Skeleton />;

  if (normErroProjetos) {
    return <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normErroProjetos)} />;
  }

  if (todosProjetos.length === 0) {
    return (
      <div className="advisor-pagina">
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone">
            <FileArchive size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Nenhum projeto vinculado</h3>
          <p className="advisor-estado-vazio__descricao">
            As entregas dos seus projetos aparecerão aqui para revisão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Revise arquivos enviados
        </h2>
        <p className="advisor-hero__subtitulo">
          Revise as entregas dos alunos, solicite ajustes ou aprove cada versão.
        </p>
      </div>

      <div className="advisor-toolbar">
        <div className="advisor-busca" style={{ maxWidth: 360 }}>
          <FolderOpen size={16} className="advisor-busca__icone" />
          <AppCombobox
            ariaLabel="Selecionar projeto"
            className="advisor-busca__input app-combobox--with-leading-icon"
            value={activeProjectId ?? ""}
            onChange={(nextValue) => setProjectId(Number(nextValue))}
            options={todosProjetos.map((p) => ({ value: p.id, label: p.title }))}
          />
        </div>
      </div>

      <div className="advisor-abas" role="tablist" aria-label="Filtro de entregas">
        {FILTROS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={filtro === item.key}
            onClick={() => setFiltro(item.key)}
            className={`advisor-abas__botao ${filtro === item.key ? "advisor-abas__botao--ativo" : ""}`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {loadingEntregas && <Skeleton linhas={4} />}

      {!loadingEntregas && normErroEntregas && (
        <StatusView title="Falha ao carregar entregas" description={getErrorMessage(normErroEntregas)} />
      )}

      {!loadingEntregas && !normErroEntregas && filtradas.length === 0 && (
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone">
            <FileArchive size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Nenhuma entrega encontrada</h3>
          <p className="advisor-estado-vazio__descricao">
            Quando os alunos enviarem arquivos para este projeto, as entregas aparecerão aqui.
          </p>
        </div>
      )}

      {!loadingEntregas && !normErroEntregas && filtradas.length > 0 && (
        <div className="advisor-lista">
          {filtradas.map((entrega, index) => {
            const expandida = expandedIds.has(entrega.id);
            const versoes = versoesPorEntrega[entrega.id] ?? [];
            const carregandoVersoes = Boolean(versoesLoading[entrega.id]);
            const erroVersoes = versoesErro[entrega.id];
            const ultima = versoes[versoes.length - 1];
            const podeRevisar =
              entrega.status === "PENDING_REVIEW" && ultima && !ultima.revisao;

            return (
              <motion.div
                key={entrega.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className="advisor-entrega"
              >
                <div className="advisor-entrega__cabecalho">
                  <div>
                    <p className="advisor-entrega__titulo">{entrega.titulo}</p>
                    <div className="advisor-entrega__meta">
                      <span>por {entrega.autorNome}</span>
                      {entrega.etapaTitulo && <span>· Etapa: {entrega.etapaTitulo}</span>}
                      {entrega.categoria && <span>· {entrega.categoria}</span>}
                      <span>· {formatDate(entrega.criadaEm)}</span>
                      <span>· {entrega.totalVersoes} versão{entrega.totalVersoes === 1 ? "" : "ões"}</span>
                    </div>
                  </div>
                  <span className={`advisor-etiqueta ${entregaPillClass(entrega.status)}`}>
                    {formatEntregaStatus(entrega.status)}
                  </span>
                </div>

                <div className="advisor-etapa__acoes">
                  <button type="button" className="advisor-etapa__botao-link" onClick={() => toggleExpandir(entrega)}>
                    {expandida ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    {expandida ? "Ocultar versões" : "Ver versões"}
                  </button>
                  {podeRevisar && (
                    <button
                      type="button"
                      className="advisor-botao advisor-botao--primario"
                      onClick={() => abrirRevisao(entrega, ultima)}
                    >
                      <CheckCircle2 size={15} />
                      Revisar
                    </button>
                  )}
                </div>

                {expandida && (
                  <div className="advisor-versoes">
                    {carregandoVersoes && <Skeleton linhas={2} />}
                    {!carregandoVersoes && erroVersoes && (
                      <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-erro)" }}>
                        Não foi possível carregar as versões.
                      </p>
                    )}
                    {!carregandoVersoes && !erroVersoes && versoes.length === 0 && (
                      <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-mudo)" }}>
                        Nenhuma versão registrada.
                      </p>
                    )}
                    {!carregandoVersoes && !erroVersoes && versoes.map((versao) => (
                      <div key={versao.id} className="advisor-versao">
                        <FileArchive size={15} className="advisor-versao__meta" />
                        <div className="advisor-versao__info">
                          <p className="advisor-versao__nome">
                            Versão {versao.numeroVersao} — {versao.nomeArquivo}
                          </p>
                          <p className="advisor-versao__meta">
                            {formatDate(versao.enviadaEm)}
                            {versao.tamanhoBytes ? ` · ${formatarTamanho(versao.tamanhoBytes)}` : ""}
                            {versao.revisao && (
                              <span> · {formatEntregaDecisao(versao.revisao.decisao)}</span>
                            )}
                          </p>
                          {versao.revisao?.comentario && (
                            <p className="advisor-versao__meta">“{versao.revisao.comentario}”</p>
                          )}
                        </div>
                        <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => baixar(entrega, versao)}>
                          <Download size={15} />
                          Baixar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Revisar entrega">
          <div className="advisor-modal">
            <div className="advisor-modal__cabecalho">
              <div>
                <h3 className="advisor-modal__titulo">Revisar entrega</h3>
                <p className="advisor-modal__descricao" style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-fraco)", marginTop: 4 }}>
                  {modal.entrega.titulo} · Versão {modal.versao.numeroVersao}
                </p>
              </div>
              <button type="button" className="advisor-modal__fechar" onClick={fecharRevisao} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="advisor-modal__corpo">
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="revisao-decisao">Decisão *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`advisor-botao ${decisao === "APPROVED" ? "advisor-botao--sucesso" : "advisor-botao--secundario"}`}
                    onClick={() => setDecisao("APPROVED")}
                  >
                    <CheckCircle2 size={15} />
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className={`advisor-botao ${decisao === "CHANGES_REQUESTED" ? "advisor-botao--perigo" : "advisor-botao--secundario"}`}
                    onClick={() => setDecisao("CHANGES_REQUESTED")}
                  >
                    <Undo2 size={15} />
                    Solicitar ajustes
                  </button>
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="revisao-comentario">
                  Comentário {decisao === "CHANGES_REQUESTED" ? "*" : ""}
                </label>
                <textarea
                  id="revisao-comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className={`advisor-campo__input ${erroForm ? "advisor-campo__input--erro" : ""}`}
                  placeholder="Explique o que precisa ser ajustado (obrigatório ao solicitar ajustes)..."
                />
                {erroForm && <span className="advisor-campo__erro">{erroForm}</span>}
              </div>
            </div>

            <div className="advisor-modal__rodape">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={fecharRevisao} disabled={revisando}>
                Cancelar
              </button>
              <button type="button" className="advisor-botao advisor-botao--primario" onClick={enviarRevisao} disabled={revisando}>
                {revisando ? "Enviando..." : "Registrar revisão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
