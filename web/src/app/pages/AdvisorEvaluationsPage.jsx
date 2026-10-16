import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FolderOpen, Star, X, Pencil, CheckCircle, ChatCircleText, Clock, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { etapaService } from "../services/etapaService";
import { evaluationService } from "../services/evaluationService";
import { mapProject, mapEtapa, mapOrientando, mapAvaliacaoAcademica } from "../utils/adapters";
import { formatAvaliacaoNota, formatDate, getInitials } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const CRITERIOS = [
  { key: "participacao", rotulo: "Participação" },
  { key: "qualidadeTecnica", rotulo: "Qualidade técnica" },
  { key: "cumprimentoDePrazos", rotulo: "Cumprimento de prazos" },
  { key: "comunicacao", rotulo: "Comunicação" },
];

function SkeletonBlock({ className = "", style }) {
  return <span className={`skeleton advisor-skeleton__block ${className}`} style={style} aria-hidden="true" />;
}

function EvaluationOptionsSkeleton() {
  return (
    <div className="advisor-skeleton__form" aria-busy="true" aria-label="Carregando opcoes de avaliacao">
      <SkeletonBlock className="advisor-skeleton__control" />
      <div className="advisor-skeleton__notes">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="advisor-skeleton__note" />
        ))}
      </div>
      <SkeletonBlock className="advisor-skeleton__comment" />
    </div>
  );
}

// Só a lista depende da API; título, filtro e ação são estáticos.
function AdvisorEvaluationSkeleton({ linhas = 4 }) {
  return (
    <div className="advisor-lista advisor-lista--skeleton" aria-busy="true" aria-label="Carregando avaliacoes">
      {Array.from({ length: linhas }).map((_, index) => (
        <article key={index} className="advisor-avaliacao advisor-avaliacao--skeleton">
          <div className="advisor-avaliacao__cabecalho advisor-skeleton__card-header">
            <div className="advisor-skeleton__content">
              <SkeletonBlock className="advisor-skeleton__line advisor-skeleton__line--lg" />
              <SkeletonBlock className="advisor-skeleton__line advisor-skeleton__line--md" />
            </div>
            <div className="advisor-skeleton__actions advisor-skeleton__actions--compact">
              <SkeletonBlock className="advisor-skeleton__pill" />
              <SkeletonBlock className="advisor-skeleton__action" />
            </div>
          </div>
          <div className="advisor-skeleton__notes">
            {Array.from({ length: 4 }).map((_, noteIndex) => (
              <SkeletonBlock key={noteIndex} className="advisor-skeleton__note" />
            ))}
          </div>
          {index === 0 && <SkeletonBlock className="advisor-skeleton__comment" />}
        </article>
      ))}
    </div>
  );
}

function AvaliacaoNota({ rotulo, valor }) {
  const nota = Number(valor) || 0;
  return (
    <div className={`advisor-nota student-nota student-nota--${nota >= 4 ? "alta" : nota >= 3 ? "media" : "baixa"}`}>
      <span className="advisor-nota__rotulo">{rotulo}</span>
      <span className="advisor-nota__valor">{valor || valor === 0 ? `${valor}/5` : "-"}</span>
      <div className="student-nota__barra" role="meter" aria-label={rotulo} aria-valuemin={0} aria-valuemax={5} aria-valuenow={nota}>
        <span style={{ width: `${Math.min(100, (nota / 5) * 100)}%` }} />
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="advisor-estrelas" role="radiogroup" aria-label="Nota de 1 a 5">
      {[1, 2, 3, 4, 5].map((nota) => (
        <button
          key={nota}
          type="button"
          role="radio"
          aria-checked={value === nota}
          aria-label={`${nota} estrela${nota > 1 ? "s" : ""}`}
          onClick={() => onChange(nota)}
          className="advisor-botao"
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
          }}
        >
          <Star
            size={22}
            className={nota <= value ? "advisor-estrela" : "advisor-estrela--vazia"}
            fill={nota <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdvisorEvaluationsPage() {
  const [projectId, setProjectId] = useState(null);
  const [modal, setModal] = useState(null);
  const [campos, setCampos] = useState(null);
  const [opcoes, setOpcoes] = useState({ alunos: [], etapas: [], loading: false });
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: projetos, loading: loadingProjetos, error: erroProjetos } = useAsyncData(
    async () => {
      const raw = await advisorService.meusProjetos();
      return (Array.isArray(raw) ? raw : []).map(mapProject);
    },
    [],
    { initialData: [] },
  );

  const todosProjetos = useMemo(() => (Array.isArray(projetos) ? projetos : []), [projetos]);
  // null = "Todos" (sem projeto específico selecionado no combobox).
  const activeProjectId = projectId;

  const { data: avaliacoes, loading: loadingAvaliacoes, error: erroAvaliacoes, reload } = useAsyncData(
    async () => {
      if (activeProjectId) {
        const raw = await evaluationService.list(activeProjectId);
        return (Array.isArray(raw) ? raw : []).map(mapAvaliacaoAcademica);
      }
      if (todosProjetos.length === 0) return [];
      const porProjeto = await Promise.all(
        todosProjetos.map((p) => evaluationService.list(p.id).catch(() => [])),
      );
      return porProjeto.flat().map(mapAvaliacaoAcademica);
    },
    [activeProjectId, todosProjetos],
    { initialData: [] },
  );

  const listaAvaliacoes = useMemo(() => (Array.isArray(avaliacoes) ? avaliacoes : []), [avaliacoes]);
  const medias = listaAvaliacoes.map((a) => Number(a.media)).filter(Number.isFinite);
  const mediaGeral = medias.length ? medias.reduce((sum, value) => sum + value, 0) / medias.length : null;
  const aguardandoCiencia = listaAvaliacoes.filter((a) => !a.cienciaRegistrada).length;

  const normErroProjetos = erroProjetos ? normalizeError(erroProjetos) : null;
  const normErroAvaliacoes = erroAvaliacoes ? normalizeError(erroAvaliacoes) : null;

  const abrirModal = async (avaliacao = null) => {
    setErroForm("");
    const modalProjectId = avaliacao?.projetoId ?? activeProjectId;
    if (!modalProjectId) return;

    setModal({ avaliacao, projetoId: modalProjectId });
    setOpcoes((prev) => ({ ...prev, loading: true }));
    setCampos(
      avaliacao
        ? {
            alunoId: avaliacao.alunoId,
            etapaId: avaliacao.etapaId,
            participacao: avaliacao.participacao,
            qualidadeTecnica: avaliacao.qualidadeTecnica,
            cumprimentoDePrazos: avaliacao.cumprimentoDePrazos,
            comunicacao: avaliacao.comunicacao,
            comentarioOrientador: avaliacao.comentarioOrientador,
          }
        : {
            alunoId: "",
            etapaId: "",
            participacao: 0,
            qualidadeTecnica: 0,
            cumprimentoDePrazos: 0,
            comunicacao: 0,
            comentarioOrientador: "",
          },
    );

    try {
      const [orientandosRaw, etapasRaw] = await Promise.all([
        advisorService.orientandos({ projetoId: modalProjectId }).catch(() => []),
        etapaService.list(modalProjectId).catch(() => []),
      ]);
      const alunos = (Array.isArray(orientandosRaw) ? orientandosRaw : []).map(mapOrientando);
      const etapas = (Array.isArray(etapasRaw) ? etapasRaw : [])
        .map(mapEtapa)
        .filter((e) => e.status === "DONE");
      setOpcoes({ alunos, etapas, loading: false });
    } catch {
      setOpcoes({ alunos: [], etapas: [], loading: false });
    }
  };

  const fecharModal = () => {
    setModal(null);
    setCampos(null);
    setErroForm("");
  };

  const salvarAvaliacao = async () => {
    if (!campos) return;
    const valores = [campos.participacao, campos.qualidadeTecnica, campos.cumprimentoDePrazos, campos.comunicacao];
    if (!campos.alunoId) {
      setErroForm("Selecione o aluno avaliado.");
      return;
    }
    if (!campos.etapaId) {
      setErroForm("Selecione a etapa concluída.");
      return;
    }
    if (valores.some((v) => !v || v < 1 || v > 5)) {
      setErroForm("Atribua uma nota de 1 a 5 para todos os critérios.");
      return;
    }
    if (!campos.comentarioOrientador.trim()) {
      setErroForm("O comentário do orientador é obrigatório.");
      return;
    }

    const payload = {
      alunoId: Number(campos.alunoId),
      etapaId: Number(campos.etapaId),
      participacao: campos.participacao,
      qualidadeTecnica: campos.qualidadeTecnica,
      cumprimentoDePrazos: campos.cumprimentoDePrazos,
      comunicacao: campos.comunicacao,
      comentarioOrientador: campos.comentarioOrientador.trim(),
    };

    setSalvando(true);
    try {
      if (modal.avaliacao) {
        await evaluationService.update(modal.projetoId, modal.avaliacao.id, payload);
        toast.success("Avaliação atualizada.");
      } else {
        await evaluationService.create(modal.projetoId, payload);
        toast.success("Avaliação registrada.");
      }
      fecharModal();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível salvar a avaliação."));
    } finally {
      setSalvando(false);
    }
  };

  const carregandoAvaliacoes = loadingProjetos || loadingAvaliacoes;

  if (!loadingProjetos && normErroProjetos) {
    return <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normErroProjetos)} />;
  }

  if (!loadingProjetos && todosProjetos.length === 0) {
    return (
      <div className="advisor-pagina">
        <div className="advisor-estado-vazio">
          <h3 className="advisor-estado-vazio__titulo">Nenhum projeto vinculado</h3>
          <p className="advisor-estado-vazio__descricao">
            As avaliações acadêmicas dos seus projetos aparecerão aqui.
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
      className="advisor-pagina student-page"
    >
      <div className="advisor-card-conteudo student-page__header">
        <div className="student-page__header-topo">
          <div>
            <h2 className="advisor-card-conteudo__titulo">Registre desempenho acadêmico</h2>
            <p className="student-page__descricao">Avalie participação, qualidade técnica, prazos e comunicação por etapa concluída.</p>
          </div>
      <div className="advisor-toolbar advisor-toolbar--avaliacoes student-page__acoes">
        {loadingProjetos ? (
          <SkeletonBlock className="advisor-skeleton__control" />
        ) : (
        <div className="advisor-busca advisor-busca--avaliacoes">
          <FolderOpen size={16} className="advisor-busca__icone" />
          <AppCombobox
            ariaLabel="Selecionar projeto"
            className="advisor-busca__input app-combobox--with-leading-icon"
            value={activeProjectId ?? ""}
            onChange={(nextValue) => setProjectId(nextValue ? Number(nextValue) : null)}
            options={[
              { value: "", label: "Todos" },
              ...todosProjetos.map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        </div>
        )}
        <button
          type="button"
          className="advisor-botao advisor-botao--primario"
          onClick={() => abrirModal()}
          disabled={!activeProjectId}
          title={!activeProjectId ? "Selecione um projeto específico para registrar uma avaliação." : undefined}
        >
          <Plus size={16} />
          Nova avaliação
        </button>
      </div>
        </div>
        <div className="student-resumo">
          <div className="student-resumo__item"><strong>{loadingAvaliacoes ? "-" : listaAvaliacoes.length}</strong><span>Avaliações</span></div>
          <div className="student-resumo__item student-resumo__item--verde"><strong>{loadingAvaliacoes ? "-" : formatAvaliacaoNota(mediaGeral)}</strong><span>Média geral</span></div>
          <div className="student-resumo__item student-resumo__item--amarelo"><strong>{loadingAvaliacoes ? "-" : aguardandoCiencia}</strong><span>Aguardando ciência</span></div>
        </div>
      </div>

      {carregandoAvaliacoes && <AdvisorEvaluationSkeleton linhas={4} />}

      {!carregandoAvaliacoes && normErroAvaliacoes && (
        <StatusView title="Falha ao carregar avaliações" description={getErrorMessage(normErroAvaliacoes)} />
      )}

      {!carregandoAvaliacoes && !normErroAvaliacoes && listaAvaliacoes.length === 0 && (
        <div className="advisor-estado-vazio">
          <h3 className="advisor-estado-vazio__titulo">Nenhuma avaliação registrada</h3>
          <p className="advisor-estado-vazio__descricao">
            Avalie os estudantes em etapas concluídas para acompanhar o desempenho.
          </p>
        </div>
      )}

      {!carregandoAvaliacoes && !normErroAvaliacoes && listaAvaliacoes.length > 0 && (
        <div className="advisor-lista">
          {listaAvaliacoes.map((avaliacao, index) => {
            const media = avaliacao.media ?? null;
            return (
              <motion.div
                key={avaliacao.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className={`advisor-avaliacao student-avaliacao${avaliacao.cienciaRegistrada ? "" : " student-avaliacao--pendente"}`}
              >
                <div className="advisor-avaliacao__cabecalho">
                  <div className="student-entrega__info">
                    <span className="advisee-avatar">{getInitials(avaliacao.alunoNome)}</span>
                    <div>
                      <p className="advisor-avaliacao__aluno">{avaliacao.alunoNome}</p>
                      <p className="advisor-avaliacao__etapa">
                        {avaliacao.etapaTitulo || `Etapa #${avaliacao.etapaId ?? "-"}`} · {formatDate(avaliacao.criadaEm)}
                        {!activeProjectId && ` · ${todosProjetos.find((p) => p.id === avaliacao.projetoId)?.title ?? "Projeto"}`}
                      </p>
                    </div>
                  </div>
                  <div className="student-avaliacao__media">
                    <strong>{formatAvaliacaoNota(media)}</strong>
                    <span>média / 5</span>
                  </div>
                </div>

                <div className="advisor-notas">
                  {CRITERIOS.map((criterio) => (
                    <AvaliacaoNota key={criterio.key} rotulo={criterio.rotulo} valor={avaliacao[criterio.key]} />
                  ))}
                </div>

                {avaliacao.comentarioOrientador && (
                  <div className="advisor-avaliacao__comentario">
                    <span><ChatCircleText size={15} /> Seu comentário</span>
                    <p>{avaliacao.comentarioOrientador}</p>
                  </div>
                )}

                <div className="student-ciencia advisor-avaliacao__rodape">
                  {avaliacao.cienciaRegistrada ? (
                    <div className="student-ciencia--ok">
                      <CheckCircle size={18} weight="fill" />
                      <div>
                        <strong>Ciência registrada{avaliacao.dataCiencia && ` em ${formatDate(avaliacao.dataCiencia)}`}</strong>
                        {avaliacao.comentarioAluno && <p>“{avaliacao.comentarioAluno}”</p>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="advisor-etiqueta advisor-etiqueta--amarelo"><Clock size={12} style={{ marginRight: 4 }} />Aguardando ciência do aluno</span>
                      <button type="button" className="advisor-botao advisor-botao--secundario advisor-botao--pequeno" onClick={() => abrirModal(avaliacao)}>
                        <Pencil size={15} />
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && createPortal((
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Avaliação acadêmica">
          <div className="advisor-modal" style={{ maxWidth: "40rem" }}>
            <div className="advisor-modal__cabecalho">
              <div>
                <h3 className="advisor-modal__titulo">
                  {modal.avaliacao ? "Editar avaliação" : "Nova avaliação"}
                </h3>
                <p className="advisor-modal__descricao" style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-fraco)", marginTop: 4 }}>
                  {modal.avaliacao ? "A avaliação pode ser editada até o estudante registrar ciência." : "Avaliação acadêmica por etapa concluída."}
                </p>
              </div>
              <button type="button" className="advisor-modal__fechar" onClick={fecharModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="advisor-modal__corpo">
              {opcoes.loading && <EvaluationOptionsSkeleton />}
              {!opcoes.loading && (
                <>
                  <div className="advisor-campo">
                    <label className="advisor-campo__rotulo" htmlFor="avaliacao-aluno">Aluno avaliado *</label>
                    <AppCombobox
                      id="avaliacao-aluno"
                      ariaLabel="Selecionar aluno avaliado"
                      className="advisor-campo__input app-combobox--advisor-input"
                      value={campos?.alunoId ?? ""}
                      onChange={(nextValue) => setCampos({ ...campos, alunoId: nextValue })}
                      options={[
                        { value: "", label: "Selecione o aluno..." },
                        ...opcoes.alunos.map((a) => ({ value: a.alunoId, label: a.nome })),
                      ]}
                    />
                  </div>

                  <div className="advisor-campo">
                    <label className="advisor-campo__rotulo" htmlFor="avaliacao-etapa">Etapa concluída *</label>
                    <AppCombobox
                      id="avaliacao-etapa"
                      ariaLabel="Selecionar etapa concluída"
                      className="advisor-campo__input app-combobox--advisor-input"
                      value={campos?.etapaId ?? ""}
                      onChange={(nextValue) => setCampos({ ...campos, etapaId: nextValue })}
                      options={[
                        { value: "", label: "Selecione a etapa..." },
                        ...opcoes.etapas.map((e) => ({ value: e.id, label: e.titulo })),
                      ]}
                    />
                    {opcoes.etapas.length === 0 && (
                      <span className="advisor-campo__erro" style={{ color: "var(--cor-texto-mudo)" }}>
                        Nenhuma etapa concluída disponível neste projeto.
                      </span>
                    )}
                  </div>

                  {CRITERIOS.map((criterio) => (
                    <div key={criterio.key} className="advisor-campo">
                      <span className="advisor-campo__rotulo">{criterio.rotulo}</span>
                      <StarPicker
                        value={campos?.[criterio.key] ?? 0}
                        onChange={(nota) => setCampos({ ...campos, [criterio.key]: nota })}
                      />
                    </div>
                  ))}

                  <div className="advisor-campo">
                    <label className="advisor-campo__rotulo" htmlFor="avaliacao-comentario">Comentário do orientador *</label>
                    <textarea
                      id="avaliacao-comentario"
                      value={campos?.comentarioOrientador ?? ""}
                      onChange={(e) => setCampos({ ...campos, comentarioOrientador: e.target.value })}
                      rows={4}
                      maxLength={2000}
                      className={`advisor-campo__input ${erroForm ? "advisor-campo__input--erro" : ""}`}
                      placeholder="Escreva um comentário sobre o desempenho do estudante..."
                    />
                    {erroForm && <span className="advisor-campo__erro">{erroForm}</span>}
                  </div>
                </>
              )}
            </div>

            <div className="advisor-modal__rodape">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={fecharModal} disabled={salvando}>
                Cancelar
              </button>
              <button
                type="button"
                className="advisor-botao advisor-botao--primario"
                onClick={salvarAvaliacao}
                disabled={salvando || opcoes.loading}
              >
                {salvando ? "Salvando..." : modal.avaliacao ? "Salvar alterações" : "Registrar avaliação"}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </motion.div>
  );
}
