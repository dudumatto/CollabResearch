import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, X, CheckCircle2, Pencil, Trash2, Calendar, Play, Flag } from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { etapaService } from "../services/etapaService";
import { projectService } from "../services/projectService";
import { mapProject, mapEtapa } from "../utils/adapters";
import { formatProjectStatus, formatEtapaStatus, formatEtapaResponsavel, formatDate } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const RESPONSAVEIS = [
  { value: "ALUNO", rotulo: "Aluno" },
  { value: "ORIENTADOR", rotulo: "Orientador" },
  { value: "AMBOS", rotulo: "Aluno e orientador" },
];

const ETAPA_PILL = {
  DONE: "advisor-etiqueta--verde",
  ACTIVE: "advisor-etiqueta--amarelo",
  REJECTED: "advisor-etiqueta--vermelho",
  PENDING: "advisor-etiqueta--vermelho",
};

function etapaPillClass(status) {
  return ETAPA_PILL[status] ?? "advisor-etiqueta--cinza";
}

function projetoPillClass(status) {
  if (status === "FINALIZADO") return "advisor-etiqueta--vermelho";
  if (status === "EM_ANDAMENTO") return "advisor-etiqueta--amarelo";
  if (status === "ABERTO") return "advisor-etiqueta--verde";
  return "advisor-etiqueta--cinza";
}

function camposVazios() {
  return { titulo: "", descricao: "", responsavel: "AMBOS", prazo: "", semData: false, obrigatoria: true };
}

function toDeliveryDatePayload(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 23, 59, 0, 0);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const minutes = String(abs % 60).padStart(2, "0");
  return `${value}T23:59:00${sign}${hours}:${minutes}`;
}

function SkeletonProgresso() {
  return (
    <div className="advisor-pagina">
      <div className="skeleton" style={{ width: "100%", height: 60, borderRadius: "var(--raio-grande)" }} />
      <div className="skeleton" style={{ width: "100%", height: 120, borderRadius: "var(--raio-grande)" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ width: "100%", height: 76, borderRadius: "var(--raio-medio)" }} />
      ))}
    </div>
  );
}

export default function AdvisorProgressPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [modal, setModal] = useState(null);
  const [campos, setCampos] = useState(camposVazios());
  const [campoErro, setCampoErro] = useState("");
  const [mutando, setMutando] = useState(false);

  const { data: projetos, loading: loadingProjetos, error: erroProjetos } = useAsyncData(
    async () => {
      const raw = await advisorService.meusProjetos();
      return (Array.isArray(raw) ? raw : []).map(mapProject);
    },
    [],
    { initialData: [] },
  );

  const projetosAtivos = useMemo(
    () => (Array.isArray(projetos) ? projetos.filter((p) => p.status === "ABERTO" || p.status === "EM_ANDAMENTO") : []),
    [projetos],
  );

  const activeProjectId = selectedProjectId ?? projetosAtivos[0]?.id ?? null;

  const { data: etapas, loading: loadingEtapas, error: erroEtapas, reload } = useAsyncData(
    async () => {
      if (!activeProjectId) return [];
      const raw = await etapaService.list(activeProjectId);
      return (Array.isArray(raw) ? raw : []).map(mapEtapa);
    },
    [activeProjectId],
    { initialData: [] },
  );

  const listaEtapas = useMemo(() => (Array.isArray(etapas) ? etapas : []), [etapas]);
  const projetoAtivo = projetosAtivos.find((p) => p.id === activeProjectId) ?? null;
  const projetoFinalizado = projetoAtivo?.status === "FINALIZADO";
  const concluidas = listaEtapas.filter((e) => e.status === "DONE").length;
  const progresso = listaEtapas.length > 0 ? Math.round((concluidas / listaEtapas.length) * 100) : 0;

  useEffect(() => {
    if (!selectedProjectId && projetosAtivos.length > 0) {
      setSelectedProjectId(projetosAtivos[0].id);
    }
  }, [projetosAtivos, selectedProjectId]);

  const normErroProjetos = erroProjetos ? normalizeError(erroProjetos) : null;
  const normErroEtapas = erroEtapas ? normalizeError(erroEtapas) : null;

  const abrirModal = (tipo, etapa = null) => {
    const editaProgresso = ["nova", "editar", "excluir"].includes(tipo);
    if (projetoFinalizado && editaProgresso) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return;
    }

    if (tipo === "nova") {
      setCampos(camposVazios());
    } else if (tipo === "editar" && etapa) {
      setCampos({
        titulo: etapa.titulo,
        descricao: etapa.descricao,
        responsavel: etapa.responsavel,
        prazo: etapa.prazo ? String(etapa.prazo).slice(0, 10) : "",
        semData: !etapa.prazo,
        obrigatoria: etapa.obrigatoria,
      });
    }
    setCampoErro("");
    setModal({ tipo, etapa });
  };

  const fecharModal = () => {
    setModal(null);
    setCampos(camposVazios());
    setCampoErro("");
  };

  const salvarEtapa = async () => {
    if (projetoFinalizado) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      fecharModal();
      return;
    }
    if (!campos.titulo.trim()) {
      setCampoErro("Informe o título da etapa.");
      return;
    }
    if (!campos.semData && !campos.prazo) {
      setCampoErro("Informe a data de entrega da etapa.");
      return;
    }
    if (!activeProjectId) return;
    setMutando(true);
    try {
      const payload = {
        titulo: campos.titulo.trim(),
        descricao: campos.descricao.trim(),
        responsavel: campos.responsavel,
        prazo: campos.semData ? null : toDeliveryDatePayload(campos.prazo),
        obrigatoria: campos.obrigatoria,
      };
      if (modal.tipo === "nova") {
        await etapaService.create(activeProjectId, payload);
        toast.success("Etapa criada com sucesso.");
      } else if (modal.tipo === "editar" && modal.etapa) {
        await etapaService.update(activeProjectId, modal.etapa.id, payload);
        toast.success("Etapa atualizada com sucesso.");
      }
      fecharModal();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível salvar a etapa."));
    } finally {
      setMutando(false);
    }
  };

  const concluirEtapa = async (etapa) => {
    if (projetoFinalizado) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return;
    }
    if (!activeProjectId) return;
    setMutando(true);
    try {
      await etapaService.complete(activeProjectId, etapa.id, "DONE");
      toast.success("Etapa concluída com sucesso.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível concluir a etapa."));
    } finally {
      setMutando(false);
    }
  };

  const excluirEtapa = async () => {
    if (projetoFinalizado) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      fecharModal();
      return;
    }
    if (!modal || modal.tipo !== "excluir" || !modal.etapa || !activeProjectId) return;
    setMutando(true);
    try {
      await etapaService.remove(activeProjectId, modal.etapa.id);
      toast.success("Etapa excluída.");
      fecharModal();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível excluir a etapa."));
    } finally {
      setMutando(false);
    }
  };

  const mudarStatusProjeto = async () => {
    if (!modal || !activeProjectId) return;
    setMutando(true);
    const novoStatus = modal.tipo === "iniciar" ? "EM_ANDAMENTO" : "FINALIZADO";
    try {
      await projectService.updateStatus(activeProjectId, novoStatus);
      toast.success(novoStatus === "EM_ANDAMENTO" ? "Projeto iniciado." : "Projeto finalizado.");
      fecharModal();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível atualizar o status do projeto."));
    } finally {
      setMutando(false);
    }
  };

  if (loadingProjetos) return <SkeletonProgresso />;

  if (normErroProjetos) {
    return <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normErroProjetos)} />;
  }

  if (projetosAtivos.length === 0) {
    return (
      <div className="advisor-pagina">
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone">
            <FolderOpen size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Nenhum projeto ativo</h3>
          <p className="advisor-estado-vazio__descricao">
            Os projetos em andamento ou abertos aparecerão aqui para você gerenciar etapas e prazos.
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
          Organize etapas e prazos
        </h2>
        <p className="advisor-hero__subtitulo">
          Defina etapas, responsáveis e prazos para cada projeto sob sua orientação.
        </p>
      </div>

      <div className="advisor-toolbar">
        <div className="advisor-busca advisor-busca--projeto">
          <FolderOpen size={16} className="advisor-busca__icone" />
          <AppCombobox
            ariaLabel="Selecionar projeto"
            className="advisor-busca__input app-combobox--with-leading-icon"
            value={activeProjectId ?? ""}
            onChange={(nextValue) => setSelectedProjectId(Number(nextValue))}
            options={projetosAtivos.map((p) => ({ value: p.id, label: p.title }))}
          />
        </div>
        {!projetoFinalizado && (
          <button type="button" className="advisor-botao advisor-botao--primario" onClick={() => abrirModal("nova")}>
            <Plus size={16} />
            Nova etapa
          </button>
        )}
      </div>

      {projetoAtivo && (
        <div className="advisor-card-conteudo">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
                {projetoAtivo.title}
              </p>
              <span className={`advisor-etiqueta ${projetoPillClass(projetoAtivo.status)}`}>
                {formatProjectStatus(projetoAtivo.status)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="advisor-percentual">{progresso}%</span>
              <div className="advisor-barra-progresso" style={{ width: 160 }}>
                <div className="advisor-barra-progresso__preenchimento" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          </div>
          <div className="advisor-linha-card__meta">
            {listaEtapas.length > 0
              ? `${concluidas} de ${listaEtapas.length} etapas concluídas`
              : "Nenhuma etapa cadastrada ainda."}
          </div>
          {!projetoFinalizado && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {projetoAtivo.status === "ABERTO" && (
              <button type="button" className="advisor-botao advisor-botao--sucesso" onClick={() => setModal({ tipo: "iniciar" })}>
                <Play size={16} />
                Iniciar projeto
              </button>
            )}
            {projetoAtivo.status === "EM_ANDAMENTO" && (
              <button type="button" className="advisor-botao advisor-botao--perigo" onClick={() => setModal({ tipo: "finalizar" })}>
                <Flag size={16} />
                Finalizar projeto
              </button>
            )}
            </div>
          )}
          {projetoFinalizado && (
            <div className="advisor-linha-card__meta">Projeto finalizado: progresso disponível apenas para consulta.</div>
          )}
        </div>
      )}

      {loadingEtapas && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 76, borderRadius: "var(--raio-medio)" }} />
          ))}
        </div>
      )}

      {!loadingEtapas && normErroEtapas && (
        <StatusView title="Falha ao carregar etapas" description={getErrorMessage(normErroEtapas)} />
      )}

      {!loadingEtapas && !normErroEtapas && listaEtapas.length === 0 && (
        <div className="advisor-estado-vazio" style={{ padding: "var(--espaco-6)" }}>
          <div className="advisor-estado-vazio__icone">
            <Calendar size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Sem etapas definidas</h3>
          <p className="advisor-estado-vazio__descricao">Crie a primeira etapa para acompanhar o progresso deste projeto.</p>
        </div>
      )}

      {!loadingEtapas && !normErroEtapas && listaEtapas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
          {listaEtapas.map((etapa, index) => {
            const concluida = etapa.status === "DONE";
            return (
              <motion.div
                key={etapa.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="advisor-etapa"
              >
                <div className="advisor-etapa__cabecalho">
                  <div>
                    <p className="advisor-etapa__titulo">{etapa.titulo}</p>
                    {etapa.descricao && <p className="advisor-etapa__descricao">{etapa.descricao}</p>}
                  </div>
                  <span className={`advisor-etiqueta ${etapaPillClass(etapa.status)}`}>
                    {formatEtapaStatus(etapa.status)}
                  </span>
                </div>
                <div className="advisor-etapa__meta">
                  <span>Responsável: {formatEtapaResponsavel(etapa.responsavel)}</span>
                  {etapa.obrigatoria && <span>Obrigatória</span>}
                  {etapa.prazo && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={12} /> Prazo: {formatDate(etapa.prazo)}
                    </span>
                  )}
                  {etapa.concluidaEm && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> Concluída em {formatDate(etapa.concluidaEm)}
                    </span>
                  )}
                </div>
                <div className="advisor-etapa__acoes">
                  {!concluida && !projetoFinalizado && (
                    <button
                      type="button"
                      className="advisor-botao advisor-botao--sucesso"
                      disabled={mutando}
                      onClick={() => concluirEtapa(etapa)}
                    >
                      <CheckCircle2 size={15} />
                      Concluir
                    </button>
                  )}
                  {!concluida && !projetoFinalizado && (
                    <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => abrirModal("editar", etapa)}>
                      <Pencil size={15} />
                      Editar
                    </button>
                  )}
                  {!concluida && !projetoFinalizado && (
                    <button type="button" className="advisor-botao advisor-botao--perigo" onClick={() => setModal({ tipo: "excluir", etapa })}>
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-label="Gerenciar etapas">
          <div className="advisor-modal">
            <div className="advisor-modal__cabecalho">
              <h3 className="advisor-modal__titulo">
                {modal.tipo === "nova" && "Nova etapa"}
                {modal.tipo === "editar" && "Editar etapa"}
                {modal.tipo === "excluir" && "Excluir etapa"}
                {modal.tipo === "iniciar" && "Iniciar projeto"}
                {modal.tipo === "finalizar" && "Finalizar projeto"}
              </h3>
              <button type="button" className="advisor-modal__fechar" onClick={fecharModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            {(modal.tipo === "nova" || modal.tipo === "editar") && (
              <div className="advisor-modal__corpo">
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="etapa-titulo">Título *</label>
                  <input
                    id="etapa-titulo"
                    type="text"
                    value={campos.titulo}
                    onChange={(e) => {
                      setCampos({ ...campos, titulo: e.target.value });
                      if (campoErro && campoErro !== "Informe a data de entrega da etapa.") setCampoErro("");
                    }}
                    className={`advisor-campo__input ${campoErro && campoErro !== "Informe a data de entrega da etapa." ? "advisor-campo__input--erro" : ""}`}
                    placeholder="Ex.: Entrega da monografia"
                  />
                  {campoErro && campoErro !== "Informe a data de entrega da etapa." && <span className="advisor-campo__erro">{campoErro}</span>}
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="etapa-descricao">Descrição</label>
                  <textarea
                    id="etapa-descricao"
                    value={campos.descricao}
                    onChange={(e) => setCampos({ ...campos, descricao: e.target.value })}
                    rows={3}
                    className="advisor-campo__input"
                    placeholder="Descreva o que deve ser entregue nesta etapa..."
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="etapa-responsavel">Responsável</label>
                  <AppCombobox
                    id="etapa-responsavel"
                    ariaLabel="Selecionar responsável"
                    className="advisor-campo__input app-combobox--advisor-input"
                    value={campos.responsavel}
                    onChange={(nextValue) => setCampos({ ...campos, responsavel: nextValue })}
                    options={RESPONSAVEIS.map((r) => ({ value: r.value, label: r.rotulo }))}
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="etapa-prazo">Data de entrega</label>
                  <input
                    id="etapa-prazo"
                    type="date"
                    value={campos.prazo}
                    disabled={campos.semData}
                    onChange={(e) => {
                      setCampos({ ...campos, prazo: e.target.value });
                      if (campoErro === "Informe a data de entrega da etapa.") setCampoErro("");
                    }}
                    className={`advisor-campo__input ${campoErro === "Informe a data de entrega da etapa." ? "advisor-campo__input--erro" : ""}`}
                  />
                  {campoErro === "Informe a data de entrega da etapa." && <span className="advisor-campo__erro">{campoErro}</span>}
                  <label className="advisor-checkbox advisor-checkbox--campo" htmlFor="etapa-sem-data">
                    <input
                      id="etapa-sem-data"
                      type="checkbox"
                      checked={campos.semData}
                      onChange={(e) => {
                        const semData = e.target.checked;
                        setCampos({ ...campos, semData, prazo: semData ? "" : campos.prazo });
                        if (semData && campoErro === "Informe a data de entrega da etapa.") setCampoErro("");
                      }}
                    />
                    <span>Esta etapa não precisa de uma data específica agora</span>
                  </label>
                </div>
                <label className="advisor-checkbox">
                  <input
                    type="checkbox"
                    checked={campos.obrigatoria}
                    onChange={(e) => setCampos({ ...campos, obrigatoria: e.target.checked })}
                  />
                  Etapa obrigatória para conclusão do projeto
                </label>
              </div>
            )}

            {modal.tipo === "excluir" && (
              <div className="advisor-modal__corpo">
                <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-medio)", lineHeight: 1.6 }}>
                  Deseja excluir a etapa <strong>{modal.etapa?.titulo}</strong>? Essa ação não poderá ser desfeita.
                </p>
              </div>
            )}

            {modal.tipo === "iniciar" && (
              <div className="advisor-modal__corpo">
                <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-medio)", lineHeight: 1.6 }}>
                  O projeto <strong>{projetoAtivo?.title}</strong> será marcado como em andamento. Confirma?
                </p>
              </div>
            )}

            {modal.tipo === "finalizar" && (
              <div className="advisor-modal__corpo">
                <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-medio)", lineHeight: 1.6 }}>
                  O projeto <strong>{projetoAtivo?.title}</strong> será finalizado. Todas as etapas obrigatórias precisam estar concluídas. Confirma?
                </p>
              </div>
            )}

            <div className="advisor-modal__rodape">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={fecharModal} disabled={mutando}>
                Cancelar
              </button>
              <button
                type="button"
                className={
                  modal.tipo === "excluir" || modal.tipo === "finalizar"
                    ? "advisor-botao advisor-botao--perigo"
                    : "advisor-botao advisor-botao--primario"
                }
                disabled={mutando}
                onClick={() => {
                  if (modal.tipo === "nova" || modal.tipo === "editar") salvarEtapa();
                  if (modal.tipo === "excluir") excluirEtapa();
                  if (modal.tipo === "iniciar" || modal.tipo === "finalizar") mudarStatusProjeto();
                }}
              >
                {mutando
                  ? "Aguarde..."
                  : modal.tipo === "excluir"
                    ? "Excluir etapa"
                    : modal.tipo === "iniciar"
                      ? "Iniciar projeto"
                      : modal.tipo === "finalizar"
                        ? "Finalizar projeto"
                        : modal.tipo === "editar"
                          ? "Salvar alterações"
                          : "Criar etapa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
