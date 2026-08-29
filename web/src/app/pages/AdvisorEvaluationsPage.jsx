import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Star, X, Pencil, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { etapaService } from "../services/etapaService";
import { evaluationService } from "../services/evaluationService";
import { mapProject, mapEtapa, mapOrientando, mapAvaliacaoAcademica } from "../utils/adapters";
import { formatAvaliacaoNota, formatDate } from "../utils/formatters";
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

function Skeleton({ linhas = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: "100%", height: 90, borderRadius: "var(--raio-grande)" }} />
      ))}
    </div>
  );
}

function AvaliacaoNota({ rotulo, valor }) {
  return (
    <div className="advisor-nota">
      <span className="advisor-nota__rotulo">{rotulo}</span>
      <span className="advisor-nota__valor">
        {valor || valor === 0 ? formatAvaliacaoNota(valor) : "-"}
      </span>
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
  const activeProjectId = projectId ?? todosProjetos[0]?.id ?? null;

  const { data: avaliacoes, loading: loadingAvaliacoes, error: erroAvaliacoes, reload } = useAsyncData(
    async () => {
      if (!activeProjectId) return [];
      const raw = await evaluationService.list(activeProjectId);
      return (Array.isArray(raw) ? raw : []).map(mapAvaliacaoAcademica);
    },
    [activeProjectId],
    { initialData: [] },
  );

  const listaAvaliacoes = useMemo(() => (Array.isArray(avaliacoes) ? avaliacoes : []), [avaliacoes]);

  const normErroProjetos = erroProjetos ? normalizeError(erroProjetos) : null;
  const normErroAvaliacoes = erroAvaliacoes ? normalizeError(erroAvaliacoes) : null;

  const abrirModal = async (avaliacao = null) => {
    setErroForm("");
    if (!activeProjectId) return;

    setModal({ avaliacao });
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
        advisorService.orientandos({ projetoId: activeProjectId }).catch(() => []),
        etapaService.list(activeProjectId).catch(() => []),
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
        await evaluationService.update(activeProjectId, modal.avaliacao.id, payload);
        toast.success("Avaliação atualizada.");
      } else {
        await evaluationService.create(activeProjectId, payload);
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

  if (loadingProjetos) return <Skeleton />;

  if (normErroProjetos) {
    return <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normErroProjetos)} />;
  }

  if (todosProjetos.length === 0) {
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
      className="advisor-pagina"
    >
      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Registre desempenho acadêmico
        </h2>
        <p className="advisor-hero__subtitulo">
          Avalie a participação, a qualidade técnica, os prazos e a comunicação de cada estudante por etapa concluída.
        </p>
      </div>

      <div className="advisor-toolbar advisor-toolbar--avaliacoes">
        <div className="advisor-busca advisor-busca--avaliacoes">
          <FolderOpen size={16} className="advisor-busca__icone" />
          <AppCombobox
            ariaLabel="Selecionar projeto"
            className="advisor-busca__input app-combobox--with-leading-icon"
            value={activeProjectId ?? ""}
            onChange={(nextValue) => setProjectId(Number(nextValue))}
            options={todosProjetos.map((p) => ({ value: p.id, label: p.title }))}
          />
        </div>
        <button type="button" className="advisor-botao advisor-botao--primario" onClick={() => abrirModal()}>
          Nova avaliação
        </button>
      </div>

      {loadingAvaliacoes && <Skeleton linhas={4} />}

      {!loadingAvaliacoes && normErroAvaliacoes && (
        <StatusView title="Falha ao carregar avaliações" description={getErrorMessage(normErroAvaliacoes)} />
      )}

      {!loadingAvaliacoes && !normErroAvaliacoes && listaAvaliacoes.length === 0 && (
        <div className="advisor-estado-vazio">
          <h3 className="advisor-estado-vazio__titulo">Nenhuma avaliação registrada</h3>
          <p className="advisor-estado-vazio__descricao">
            Avalie os estudantes em etapas concluídas para acompanhar o desempenho.
          </p>
        </div>
      )}

      {!loadingAvaliacoes && !normErroAvaliacoes && listaAvaliacoes.length > 0 && (
        <div className="advisor-lista">
          {listaAvaliacoes.map((avaliacao, index) => {
            const media = avaliacao.media ?? null;
            return (
              <motion.div
                key={avaliacao.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className="advisor-avaliacao"
              >
                <div className="advisor-avaliacao__cabecalho">
                  <div>
                    <p className="advisor-avaliacao__aluno">{avaliacao.alunoNome}</p>
                    <p className="advisor-avaliacao__etapa">
                      {avaliacao.etapaTitulo || `Etapa #${avaliacao.etapaId ?? "-"}`} · {formatDate(avaliacao.criadaEm)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="advisor-percentual">Média {formatAvaliacaoNota(media)}</span>
                    {avaliacao.cienciaRegistrada ? (
                      <span className="advisor-etiqueta advisor-etiqueta--verde">
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        Ciência registrada
                      </span>
                    ) : (
                      <span className="advisor-etiqueta advisor-etiqueta--amarelo">Aguardando ciência</span>
                    )}
                    {!avaliacao.cienciaRegistrada && (
                      <button
                        type="button"
                        className="advisor-botao advisor-botao--secundario"
                        onClick={() => abrirModal(avaliacao)}
                      >
                        <Pencil size={15} />
                        Editar
                      </button>
                    )}
                  </div>
                </div>

                <div className="advisor-notas">
                  <AvaliacaoNota rotulo="Participação" valor={avaliacao.participacao} />
                  <AvaliacaoNota rotulo="Qualidade técnica" valor={avaliacao.qualidadeTecnica} />
                  <AvaliacaoNota rotulo="Cumprimento de prazos" valor={avaliacao.cumprimentoDePrazos} />
                  <AvaliacaoNota rotulo="Comunicação" valor={avaliacao.comunicacao} />
                </div>

                {avaliacao.comentarioOrientador && (
                  <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-fraco)", lineHeight: 1.6 }}>
                    “{avaliacao.comentarioOrientador}”
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && (
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
              {opcoes.loading && <Skeleton linhas={2} />}
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
      )}
    </motion.div>
  );
}
