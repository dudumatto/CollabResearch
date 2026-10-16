import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Tray, Check, X, FileText, CaretRight, User, Sparkle, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { applicationService } from "../services/applicationService";
import { mapAdvisorApplication } from "../utils/adapters";
import { formatApplicationStatus, formatDate } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import { LumenAIButton } from "../components/ui/LumenAIButton";
import { LumenTooltip } from "../components/ui/LumenTooltip";
import { useLumenAnalysis } from "../providers/LumenAnalysisProvider";
import { Sk } from "../components/Skeleton";
import "./AdvisorWorkspace.css";

const FILTROS = [
  { key: "todas", rotulo: "Todas" },
  { key: "PENDENTE", rotulo: "Pendentes" },
  { key: "APROVADO", rotulo: "Aprovadas" },
  { key: "REJEITADO", rotulo: "Rejeitadas" },
];

function iniciais(nome = "") {
  return String(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function AvatarAluno({ nome, src }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div className="advisor-linha-card__icone" style={{ borderRadius: "var(--raio-completo)" }}>
      {showPhoto ? (
        <img src={src} alt={`Foto de perfil de ${nome}`} onError={() => setFailed(true)} />
      ) : (
        <span style={{ fontSize: "var(--tamanho-normal)", fontWeight: 700 }}>{iniciais(nome || "?")}</span>
      )}
    </div>
  );
}
function statusPillClass(status) {
  if (status === "PENDENTE") return "advisor-etiqueta--amarelo";
  if (status === "APROVADO") return "advisor-etiqueta--verde";
  if (status === "REJEITADO") return "advisor-etiqueta--vermelho";
  return "advisor-etiqueta--cinza";
}

function corPontuacao(pontuacao) {
  if (pontuacao >= 7) return "advisor-etiqueta--verde";
  if (pontuacao >= 4) return "advisor-etiqueta--amarelo";
  return "advisor-etiqueta--vermelho";
}

const CONFIANCA_ROTULO = { alto: "Confiança alta", medio: "Confiança média", baixo: "Confiança baixa" };

function ListaLumen({ titulo, itens }) {
  if (!itens?.length) return null;
  return (
    <div>
      <strong className="advisor-lumen__subtitulo-lista">{titulo}</strong>
      <ul className="advisor-lumen__lista-itens">
        {itens.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function DetalhesLumen({ avaliacao }) {
  return (
    <div className="advisor-lumen__detalhes">
      <span className="advisor-etiqueta advisor-etiqueta--cinza">
        {CONFIANCA_ROTULO[avaliacao.confianca] ?? CONFIANCA_ROTULO.medio}
      </span>
      <ul className="advisor-lumen__criterios">
        {avaliacao.criterios?.map((c) => (
          <li key={c.chave}>
            <div className="advisor-lumen__criterio-topo">
              <span>{c.nome} <small>({c.peso}%)</small></span>
              <strong>{c.nota != null ? `${c.nota}/10` : "sem dados"}</strong>
            </div>
            {c.justificativa && <p className="advisor-lumen__texto">{c.justificativa}</p>}
          </li>
        ))}
      </ul>
      <ListaLumen titulo="Pontos fortes" itens={avaliacao.pontosFortes} />
      <ListaLumen titulo="Pontos de atenção" itens={avaliacao.pontosAtencao} />
    </div>
  );
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
        <Tray size={22} />
      </div>
      <h3 className="advisor-estado-vazio__titulo">{titulo}</h3>
      <p className="advisor-estado-vazio__descricao">{descricao}</p>
    </div>
  );
}

const LUMEN_TOOLTIP =
  "Atribui nota de 0 a 10 às inscrições pendentes conforme a compatibilidade com o projeto e gera um ranking para apoiar sua decisão. A nota é só uma sugestão.";

export default function AdvisorApplicationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rodando: lumenLoading, conclusao, iniciar } = useLumenAnalysis();
  const [filtro, setFiltro] = useState("todas");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [modal, setModal] = useState(null);
  const [parecer, setParecer] = useState("");
  const [acaoLoadingId, setAcaoLoadingId] = useState(null);
  const [projetoFiltrado, setProjetoFiltrado] = useState("");
  const [lumenModalAberto, setLumenModalAberto] = useState(false);
  const [lumenFoco, setLumenFoco] = useState(null);
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState(() => new Set());

  const { data, loading, error, setData } = useAsyncData(
    async () => {
      const raw = await advisorService.inscricoes();
      return (Array.isArray(raw) ? raw : []).map(mapAdvisorApplication);
    },
    [],
    { initialData: [] },
  );

  const inscricoes = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const projetos = useMemo(() => {
    const mapa = new Map();
    inscricoes.forEach((app) => {
      if (app.projetoId && !mapa.has(app.projetoId)) {
        mapa.set(app.projetoId, app.projetoTitulo || `Projeto ${app.projetoId}`);
      }
    });
    return Array.from(mapa, ([id, titulo]) => ({ id, titulo }));
  }, [inscricoes]);

  const filtradasPorStatus = useMemo(() => {
    if (filtro === "todas") return inscricoes;
    return inscricoes.filter((app) => app.status === filtro);
  }, [inscricoes, filtro]);

  const rankingMap = useMemo(() => {
    const mapa = new Map();
    // Avaliações da Lumen salvas no servidor junto com cada inscrição.
    inscricoes.forEach((app) => {
      if (app.lumenPontuacao != null) {
        mapa.set(app.id, {
          inscricaoId: app.id,
          nomeAluno: app.alunoNome,
          pontuacao: app.lumenAvaliacao?.notaFinal ?? app.lumenPontuacao,
          justificativa: app.lumenJustificativa,
          avaliacao: app.lumenAvaliacao,
        });
      }
    });
    return mapa;
  }, [inscricoes]);

  const filtradas = useMemo(() => {
    const base = projetoFiltrado
      ? filtradasPorStatus.filter((app) => String(app.projetoId) === String(projetoFiltrado))
      : filtradasPorStatus;
    if (rankingMap.size === 0) return base;
    return [...base].sort((a, b) => {
      const pa = rankingMap.get(a.id)?.pontuacao ?? -1;
      const pb = rankingMap.get(b.id)?.pontuacao ?? -1;
      return pb - pa;
    });
  }, [filtradasPorStatus, projetoFiltrado, rankingMap]);

  const lumenRanking = useMemo(
    () => filtradas.filter((app) => rankingMap.has(app.id)).map((app) => rankingMap.get(app.id)),
    [filtradas, rankingMap],
  );

  const counts = useMemo(
    () => ({
      todas: inscricoes.length,
      PENDENTE: inscricoes.filter((a) => a.status === "PENDENTE").length,
      APROVADO: inscricoes.filter((a) => a.status === "APROVADO").length,
      REJEITADO: inscricoes.filter((a) => a.status === "REJEITADO").length,
    }),
    [inscricoes],
  );

  const pendentesDoProjeto = useMemo(
    () => (projetoFiltrado
      ? inscricoes.filter((app) => app.status === "PENDENTE" && String(app.projetoId) === String(projetoFiltrado))
      : []),
    [inscricoes, projetoFiltrado],
  );
  const motivoLumenIndisponivel = !projetoFiltrado
    ? "Selecione um projeto para analisar com a Lumen."
    : pendentesDoProjeto.length === 0
      ? "Este projeto não tem inscrições pendentes para analisar."
      : null;

  // A análise roda no provider do layout: continua se o orientador sair da tela.
  const analisarComLumen = (projetoId = projetoFiltrado, ids = []) => {
    setLumenModalAberto(false);
    setSelecionando(false);
    setSelecionados(new Set());
    iniciar(projetoId, ids);
  };

  // Análise concluída com a página aberta: guarda as novas avaliações (o servidor também já as salvou).
  useEffect(() => {
    if (!conclusao) return;
    const novas = new Map(conclusao.ranking.map((c) => [c.inscricaoId, c]));
    setData((prev) => (Array.isArray(prev)
      ? prev.map((app) => (novas.has(app.id)
        ? {
          ...app,
          lumenPontuacao: novas.get(app.id).pontuacao,
          lumenJustificativa: novas.get(app.id).justificativa,
          lumenAvaliacao: novas.get(app.id).avaliacao ?? null,
        }
        : app))
      : prev));
  }, [conclusao, setData]);

  // "Ver resultados" da notificação: abre a avaliação do projeto analisado.
  const lumenResultados = location.state?.lumenResultados;
  useEffect(() => {
    if (!lumenResultados) return;
    setFiltro("PENDENTE");
    setProjetoFiltrado(lumenResultados.projetoId);
    setLumenFoco(lumenResultados.foco);
    setLumenModalAberto(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [lumenResultados, location.pathname, navigate]);

  const appEmFoco = lumenFoco != null ? inscricoes.find((app) => app.id === lumenFoco) : null;

  const toggleSelecionado = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const openStudentProfile = (app) => {
    const userId = app?.alunoUsuarioId ?? app?.alunoId;
    if (!userId) return;
    closeModal();
    navigate(`/app/users/${userId}`);
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
      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Analise novas candidaturas
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
            onClick={() => {
              setFiltro(item.key);
            }}
            className={`advisor-abas__botao ${filtro === item.key ? "advisor-abas__botao--ativo" : ""}`}
          >
            {item.rotulo} ({loading ? <Sk inline w={12} h={12} /> : counts[item.key] ?? 0})
          </button>
        ))}
      </div>

      {projetos.length > 0 && (
        <div className="advisor-inscricoes-acoes" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: "var(--espaco-3)" }}>
          <AppCombobox
            ariaLabel="Filtrar por projeto"
            className="advisor-select"
            value={projetoFiltrado}
            onChange={(value) => {
              setProjetoFiltrado(value);
            }}
            options={[
              { value: "", label: "Todos os projetos" },
              ...projetos.map((p) => ({ value: p.id, label: p.titulo })),
            ]}
          />

          {!selecionando && (
            <LumenTooltip title={motivoLumenIndisponivel ?? LUMEN_TOOLTIP} placement="top">
              <span style={{ display: "inline-flex" }}>
                <LumenAIButton
                  onClick={() => analisarComLumen()}
                  disabled={lumenLoading || Boolean(motivoLumenIndisponivel)}
                >
                  {lumenLoading
                    ? "Analisando..."
                    : pendentesDoProjeto.some((app) => rankingMap.has(app.id)) ? "Avaliar novos com Lumen" : "Analisar com Lumen"}
                </LumenAIButton>
              </span>
            </LumenTooltip>
          )}

          {selecionando ? (
            <>
              <LumenAIButton
                onClick={() => analisarComLumen(projetoFiltrado, [...selecionados])}
                disabled={lumenLoading || selecionados.size === 0}
              >
                Reavaliar selecionados ({selecionados.size})
              </LumenAIButton>
              <button
                type="button"
                className="advisor-botao advisor-botao--secundario"
                onClick={() => {
                  setSelecionando(false);
                  setSelecionados(new Set());
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="advisor-botao advisor-botao--secundario"
              onClick={() => {
                setFiltro("PENDENTE");
                setSelecionando(true);
              }}
              disabled={lumenLoading || Boolean(motivoLumenIndisponivel)}
            >
              Selecionar para reavaliar
            </button>
          )}

          {lumenRanking.length > 0 && (
            <button
              type="button"
              className="advisor-botao advisor-botao--secundario"
              onClick={() => {
                setLumenFoco(null);
                setLumenModalAberto(true);
              }}
            >
              Ver últimas avaliações da Lumen
            </button>
          )}
          {!selecionando && motivoLumenIndisponivel && !lumenLoading && (
            <p className="advisor-inscricoes-dica">{motivoLumenIndisponivel}</p>
          )}
        </div>
      )}

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
            const selecionavel = selecionando && app.status === "PENDENTE";
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={`advisor-linha-card${selecionavel ? " advisor-linha-card--selecionavel-multi" : ""}${selecionavel && selecionados.has(app.id) ? " advisor-linha-card--selecionada" : ""}`}
                onClick={selecionavel ? (e) => {
                  if (!e.target.closest("button, a, input, label")) toggleSelecionado(app.id);
                } : undefined}
              >
                {selecionavel && (
                  <input
                    type="checkbox"
                    checked={selecionados.has(app.id)}
                    onChange={() => toggleSelecionado(app.id)}
                    aria-label={`Selecionar ${app.alunoNome} para reavaliar`}
                    style={{ width: 18, height: 18, accentColor: "var(--cor-primaria)", flex: "0 0 auto" }}
                  />
                )}
                <AvatarAluno nome={app.alunoNome} src={app.alunoFotoPerfilUrl} />

                <div className="advisor-linha-card__conteudo">
                  <p className="advisor-linha-card__titulo">{app.alunoNome}</p>

                  <p className="advisor-linha-card__meta">
                    <strong>{app.projetoTitulo}</strong> · {formatDate(app.appliedAt)}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    <span className={`advisor-etiqueta ${statusPillClass(app.status)}`}>
                      {formatApplicationStatus(app.status)}
                    </span>
                    {rankingMap.has(app.id) && (
                      <button
                        type="button"
                        className={`advisor-etiqueta ${corPontuacao(rankingMap.get(app.id).pontuacao)}`}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Ver a avaliação da Lumen para este candidato"
                        onClick={() => {
                          setLumenFoco(app.id);
                          setLumenModalAberto(true);
                        }}
                      >
                        <Sparkle size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />
                        Lumen: {rankingMap.get(app.id).pontuacao}/10
                      </button>
                    )}
                    {app.status === "PENDENTE" && app.projetoId != null && !selecionando && (
                      <button
                        type="button"
                        className="advisor-etapa__botao-link"
                        disabled={lumenLoading}
                        onClick={() => analisarComLumen(app.projetoId, [app.id])}
                      >
                        <Sparkle size={12} />
                        {rankingMap.has(app.id) ? "Reavaliar" : "Avaliar"}
                      </button>
                    )}
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
                  {(app.alunoUsuarioId ?? app.alunoId) && (
                    <button
                      type="button"
                      className="advisor-botao advisor-botao--secundario advisor-linha-card__perfil-aluno"
                      onClick={() => openStudentProfile(app)}
                    >
                      <User size={14} />
                      Ver perfil do aluno
                    </button>
                  )}
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
                      <CaretRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && createPortal((
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Decidir inscrição">
          <div className="advisor-modal">
            <div className="advisor-modal__cabecalho">
              <div className="advisor-modal__cabecalho-conteudo">
                <h3 className="advisor-modal__titulo">
                  {modal.type === "aprovar" ? "Aprovar inscrição" : "Rejeitar inscrição"}
                </h3>
                <div className="advisor-modal__aluno-linha">
                  <p className="advisor-modal__descricao advisor-modal__descricao--aluno">
                    {modal.app.alunoNome}
                  </p>
                  {(modal.app.alunoUsuarioId ?? modal.app.alunoId) && (
                    <button
                      type="button"
                      className="advisor-botao advisor-botao--secundario advisor-modal__perfil-aluno"
                      onClick={() => openStudentProfile(modal.app)}
                    >
                      <User size={14} />
                      Ver perfil do aluno
                    </button>
                  )}
                </div>
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
      ), document.body)}

      {lumenModalAberto && lumenRanking.length > 0 && createPortal((
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Resultado da análise Lumen">
          <div className="advisor-modal advisor-lumen">
            <div className="advisor-modal__cabecalho">
              <div className="advisor-lumen__icone" aria-hidden="true">
                <Sparkle size={22} weight="fill" />
              </div>
              <div className="advisor-modal__cabecalho-conteudo">
                <h3 className="advisor-modal__titulo">
                  {lumenFoco != null ? "Avaliação da Lumen" : "Sugestão da Lumen"}
                </h3>
                <p className="advisor-lumen__subtitulo">Análise de compatibilidade com o projeto</p>
              </div>
              <button
                type="button"
                className="advisor-modal__fechar"
                onClick={() => setLumenModalAberto(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="advisor-modal__corpo">
              {lumenRanking.length === 0 ? (
                <p className="advisor-hero__subtitulo">Nenhuma avaliação da Lumen disponível.</p>
              ) : (
                <div className="advisor-lumen__lista">
                  {lumenRanking.map((c, i) => (lumenFoco == null || c.inscricaoId === lumenFoco) && (
                    <div key={c.inscricaoId} className="advisor-lumen__card">
                      <div className="advisor-lumen__card-topo">
                        <span className="advisor-lumen__posicao">{i + 1}º</span>
                        <strong className="advisor-lumen__nome">{c.nomeAluno}</strong>
                        <span className={`advisor-etiqueta ${corPontuacao(c.pontuacao)}`}>{c.pontuacao}/10</span>
                      </div>
                      <p className="advisor-lumen__texto">{c.justificativa}</p>
                      {c.avaliacao && <DetalhesLumen avaliacao={c.avaliacao} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="advisor-lumen__aviso">
              <Warning size={14} weight="fill" />
              Sugestão gerada por IA. A decisão final é sempre do orientador.
            </p>

            <div className="advisor-lumen__acoes">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => setLumenModalAberto(false)}>
                Fechar
              </button>
              {appEmFoco?.status === "PENDENTE" && appEmFoco.projetoId != null && (
                <LumenAIButton
                  disabled={lumenLoading}
                  onClick={() => analisarComLumen(appEmFoco.projetoId, [appEmFoco.id])}
                >
                  {lumenLoading ? "Reavaliando..." : "Reavaliar"}
                </LumenAIButton>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </motion.div>
  );
}
