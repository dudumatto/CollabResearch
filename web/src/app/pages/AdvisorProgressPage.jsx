import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { FolderOpen, Plus, X, Calendar, Play, Flag, ArrowLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { projectService } from "../services/projectService";
import { mapProject } from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import { AdvisorMarcoCard } from "../components/progress/AdvisorMarcoCard";
import { FiltrosMarco } from "../components/progress/MarcoPartes";
import { marcosApi } from "../components/progress/marcosApi";
import { MarcoForm, MARCO_FORM_ID } from "../components/progress/MarcoForm";
import { useMarcos } from "../components/progress/useMarcos";
import { contarFiltros, filtrarMarcos, mensagemDeErro } from "../components/progress/marcoUtils";
import { Sk, SkLines } from "../components/Skeleton";
import "./AdvisorWorkspace.css";

function projetoPillClass(status) {
  if (status === "FINALIZADO") return "advisor-etiqueta--vermelho";
  if (status === "EM_ANDAMENTO") return "advisor-etiqueta--amarelo";
  if (status === "ABERTO") return "advisor-etiqueta--verde";
  return "advisor-etiqueta--cinza";
}

function camposVazios() {
  return { titulo: "", descricao: "", prazo: "", semData: false, obrigatoria: true, tarefas: [] };
}

function toDeliveryDatePayload(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return `${value}T12:00:00Z`;
}

function ChipsResumo({ resumo }) {
  if (!resumo) return null;
  return (
    <>
      {resumo.marcosEmRevisao > 0 ? (
        <span className="marco-chip marco-chip--info">{resumo.marcosEmRevisao} {resumo.marcosEmRevisao === 1 ? "marco em revisão" : "marcos em revisão"}</span>
      ) : null}
      {resumo.marcosComAtencao > 0 ? (
        <span className="marco-chip marco-chip--danger">{resumo.marcosComAtencao} {resumo.marcosComAtencao === 1 ? "marco com atenção" : "marcos com atenção"}</span>
      ) : null}
    </>
  );
}

export default function AdvisorProgressPage() {
  const location = useLocation();
  const projetoDaUrl = Number(new URLSearchParams(location.search).get("projectId")) || null;
  const [selectedProjectId, setSelectedProjectId] = useState(projetoDaUrl);
  const [modal, setModal] = useState(null);
  const [mutando, setMutando] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [somenteRevisao, setSomenteRevisao] = useState(false);

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

  // Resumo de cada pesquisa para acompanhar várias ao mesmo tempo (revisões pendentes, atenção).
  const { data: resumos } = useAsyncData(
    async () => {
      const pares = await Promise.all(
        projetosAtivos.map((p) => marcosApi.getProgressSummary(p.id).then((r) => [p.id, r]).catch(() => [p.id, null])),
      );
      return Object.fromEntries(pares);
    },
    [projetosAtivos],
    { initialData: {} },
  );

  const activeProjectId = selectedProjectId;
  const {
    marcos: listaMarcos,
    resumo,
    loading: loadingMarcos,
    error: erroMarcos,
    recarregar,
    executar,
  } = useMarcos(activeProjectId);

  const projetoAtivo = projetosAtivos.find((p) => p.id === activeProjectId) ?? null;
  const projetoFinalizado = projetoAtivo?.status === "FINALIZADO";
  const contagem = useMemo(() => contarFiltros(listaMarcos), [listaMarcos]);
  const marcosFiltrados = useMemo(() => filtrarMarcos(listaMarcos, filtro), [listaMarcos, filtro]);

  useEffect(() => {
    // Só pula direto pro projeto quando não há escolha real a fazer — com
    // 2+ projetos ativos, o orientador decide na tela de seleção abaixo.
    if (!selectedProjectId && projetosAtivos.length === 1) {
      setSelectedProjectId(projetosAtivos[0].id);
    }
  }, [projetosAtivos, selectedProjectId]);

  const normErroProjetos = erroProjetos ? normalizeError(erroProjetos) : null;

  const pid = activeProjectId;
  const comToast = useCallback(async (fn, sucesso, falha) => {
    try {
      const resultado = await fn();
      if (sucesso) toast.success(sucesso);
      return resultado;
    } catch (err) {
      toast.error(mensagemDeErro(err, falha));
      return undefined;
    }
  }, []);

  const acoes = useMemo(() => {
    if (projetoFinalizado) return { historico: (m) => marcosApi.listRevisoes(pid, m.id) };
    return {
      editar: (marco) => abrirModal("editar", marco),
      excluir: (marco) => setModal({ tipo: "excluir", marco }),
      moverMarco: async (marco, direcao) => {
        const ids = listaMarcos.map((m) => m.id);
        const de = ids.indexOf(marco.id);
        const para = de + direcao;
        if (para < 0 || para >= ids.length) return;
        [ids[de], ids[para]] = [ids[para], ids[de]];
        await comToast(() => executar(() => marcosApi.reorderMarcos(pid, ids)), null, "Não foi possível reordenar os marcos.");
      },
      // adicionar/renomear/revisar propagam o erro: o formulário mostra a mensagem junto ao campo.
      adicionarTarefa: async (marco, dados) => {
        await executar(() => marcosApi.createTarefa(pid, marco.id, dados));
        toast.success("Tarefa adicionada.");
      },
      renomearTarefa: (marco, tarefa, titulo) => executar(() => marcosApi.updateTarefa(pid, marco.id, tarefa.id, { titulo })),
      removerTarefa: (marco, tarefa) => comToast(() => executar(() => marcosApi.deleteTarefa(pid, marco.id, tarefa.id)), "Tarefa removida.", "Não foi possível remover a tarefa."),
      moverTarefa: (marco, lista, tarefa, direcao) => {
        const ids = lista.map((t) => t.id);
        const de = ids.indexOf(tarefa.id);
        const para = de + direcao;
        if (para < 0 || para >= ids.length) return undefined;
        [ids[de], ids[para]] = [ids[para], ids[de]];
        return comToast(() => executar(() => marcosApi.reorderTarefas(pid, marco.id, ids)), null, "Não foi possível reordenar as tarefas.");
      },
      alterarObrigatoria: (marco, tarefa, obrigatoria) => comToast(() => executar(() => marcosApi.updateTarefa(pid, marco.id, tarefa.id, { obrigatoria })), null, "Não foi possível alterar a obrigatoriedade."),
      revisar: async (marco, dados) => {
        await executar(() => marcosApi.reviewMarco(pid, marco.id, dados));
        toast.success(dados.acao === "APROVAR" ? "Marco aprovado." : "Marco devolvido ao aluno.");
      },
      historico: (marco) => marcosApi.listRevisoes(pid, marco.id),
    };
    // abrirModal só depende de projetoFinalizado e de setters estáveis
  }, [projetoFinalizado, listaMarcos, pid, executar, comToast]);

  function abrirModal(tipo, marco = null) {
    if (projetoFinalizado && tipo !== "iniciar" && tipo !== "finalizar") {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      return;
    }

    const valores = tipo === "nova"
      ? camposVazios()
      : tipo === "editar" && marco
        ? {
          titulo: marco.titulo,
          descricao: marco.descricao ?? "",
          prazo: marco.prazo ? String(marco.prazo).slice(0, 10) : "",
          semData: !marco.prazo,
          obrigatoria: marco.obrigatoria ?? true,
          tarefas: [],
        }
        : null;
    setModal({ tipo, marco, valores });
  }

  const fecharModal = () => {
    setModal(null);
  };

  const salvarMarco = async (campos) => {
    if (projetoFinalizado) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      fecharModal();
      return;
    }
    if (!pid) return;
    setMutando(true);
    try {
      const payload = {
        titulo: campos.titulo.trim(),
        descricao: campos.descricao.trim(),
        responsavel: modal.marco?.responsavel ?? "AMBOS",
        prazo: campos.semData ? null : toDeliveryDatePayload(campos.prazo),
        obrigatoria: campos.obrigatoria,
      };
      if (modal.tipo === "nova") {
        const titulos = campos.tarefas.map((t) => t.titulo.trim()).filter(Boolean);
        let falhas = 0;
        await executar(async () => {
          const criado = await marcosApi.createMarco(pid, payload);
          const marcoId = criado?.id ?? (await marcosApi.listMarcos(pid)).filter((m) => m.titulo === payload.titulo).at(-1)?.id;
          for (const titulo of titulos) {
            try {
              await marcosApi.createTarefa(pid, marcoId, { titulo, obrigatoria: false });
            } catch {
              falhas += 1;
            }
          }
        });
        if (falhas > 0) toast.warning(`Marco criado, mas ${falhas} ${falhas === 1 ? "tarefa não foi adicionada" : "tarefas não foram adicionadas"}.`);
        else toast.success("Marco criado com sucesso.");
      } else if (modal.tipo === "editar" && modal.marco) {
        await executar(() => marcosApi.updateMarco(pid, modal.marco.id, payload));
        toast.success("Marco atualizado com sucesso.");
      }
      fecharModal();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível salvar o marco."));
    } finally {
      setMutando(false);
    }
  };

  const excluirMarco = async () => {
    if (projetoFinalizado) {
      toast.warning("Projeto finalizado não permite alterações de progresso.");
      fecharModal();
      return;
    }
    if (!modal || modal.tipo !== "excluir" || !modal.marco || !pid) return;
    setMutando(true);
    try {
      await executar(() => marcosApi.deleteMarco(pid, modal.marco.id));
      toast.success("Marco excluído.");
      fecharModal();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível excluir o marco."));
    } finally {
      setMutando(false);
    }
  };

  const mudarStatusProjeto = async () => {
    if (!modal || !pid) return;
    setMutando(true);
    const novoStatus = modal.tipo === "iniciar" ? "EM_ANDAMENTO" : "FINALIZADO";
    try {
      await projectService.updateStatus(pid, novoStatus);
      toast.success(novoStatus === "EM_ANDAMENTO" ? "Projeto iniciado." : "Projeto finalizado.");
      fecharModal();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível atualizar o status do projeto."));
    } finally {
      setMutando(false);
    }
  };

  // Títulos, filtros e ações aparecem na hora; só dados de projetos e marcos
  // mostram skeleton enquanto a API responde.
  if (!loadingProjetos && normErroProjetos) {
    return <StatusView title="Falha ao carregar projetos" description={getErrorMessage(normErroProjetos)} />;
  }

  if (!loadingProjetos && projetosAtivos.length === 0) {
    return (
      <div className="advisor-pagina">
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone">
            <FolderOpen size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Nenhum projeto ativo</h3>
          <p className="advisor-estado-vazio__descricao">
            Os projetos em andamento ou abertos aparecerão aqui para você gerenciar marcos, tarefas e prazos.
          </p>
        </div>
      </div>
    );
  }

  if (!activeProjectId) {
    const comRevisao = (p) => resumos?.[p.id]?.marcosEmRevisao ?? 0;
    const totalPendentes = projetosAtivos.filter((p) => comRevisao(p) > 0).length;
    const lista = projetosAtivos
      .filter((p) => !somenteRevisao || comRevisao(p) > 0)
      .sort((a, b) => comRevisao(b) - comRevisao(a));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="advisor-pagina advisor-pagina--progresso"
      >
        <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
          <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
            Escolha um projeto
          </h2>
          <p className="advisor-hero__subtitulo">
            Selecione o projeto para organizar marcos e revisar o que os alunos enviaram.
          </p>
        </div>

        <div className="marco-filtros" role="group" aria-label="Filtrar projetos" style={{ marginTop: 0 }}>
          <button type="button" className="marco-filtro" aria-pressed={!somenteRevisao} onClick={() => setSomenteRevisao(false)}>
            Todos <span className="marco-filtro__contador">{loadingProjetos ? <Sk inline w={12} h={12} /> : projetosAtivos.length}</span>
          </button>
          <button type="button" className="marco-filtro" aria-pressed={somenteRevisao} onClick={() => setSomenteRevisao(true)}>
            Com revisão pendente <span className="marco-filtro__contador">{loadingProjetos ? <Sk inline w={12} h={12} /> : totalPendentes}</span>
          </button>
        </div>

        {loadingProjetos ? (
          <SkLines rows={3} h={76} gap="var(--espaco-3)" label="Carregando projetos" />
        ) : lista.length === 0 ? (
          <p className="advisor-etapas-grupo__vazio">Nenhum projeto com revisão pendente.</p>
        ) : (
          <div className="advisor-lista">
            {lista.map((projeto) => {
              const r = resumos?.[projeto.id];
              return (
                <button
                  key={projeto.id}
                  type="button"
                  className="advisor-linha-card advisor-linha-card--selecionavel"
                  onClick={() => setSelectedProjectId(projeto.id)}
                >
                  <div className="advisor-linha-card__conteudo">
                    <p className="advisor-linha-card__titulo">{projeto.title}</p>
                    <p className="advisor-linha-card__meta">
                      {projeto.area ? `${projeto.area} · ` : ""}{formatProjectStatus(projeto.status)}
                      {r ? ` · ${r.itensConcluidos} de ${r.itensTotal} itens (${r.percentualGeral}%)` : ""}
                    </p>
                  </div>
                  <div className="advisor-linha-card__acoes">
                    <ChipsResumo resumo={r} />
                    <span className={`advisor-etiqueta ${projetoPillClass(projeto.status)}`}>
                      {formatProjectStatus(projeto.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina advisor-pagina--progresso"
    >
      {projetosAtivos.length > 1 && (
        <button
          type="button"
          className="advisor-voltar"
          onClick={() => { setSelectedProjectId(null); setFiltro("todos"); }}
        >
          <ArrowLeft size={16} />
          Voltar para projetos
        </button>
      )}

      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Organize etapas e prazos
        </h2>
        <p className="advisor-hero__subtitulo">
          Defina marcos com checklist e prazos para cada projeto sob sua orientação e revise os marcos enviados pelos alunos.
        </p>
      </div>

      <div className="advisor-toolbar">
        {loadingProjetos ? (
          <Sk w="min(25rem, 100%)" h="3rem" r="var(--raio-medio)" />
        ) : (
        <div className="advisor-busca advisor-busca--projeto">
          <FolderOpen size={16} className="advisor-busca__icone" />
          <AppCombobox
            ariaLabel="Selecionar projeto"
            className="advisor-busca__input app-combobox--with-leading-icon"
            value={activeProjectId ?? ""}
            onChange={(nextValue) => { setSelectedProjectId(Number(nextValue)); setFiltro("todos"); }}
            options={projetosAtivos.map((p) => {
              const pendentes = resumos?.[p.id]?.marcosEmRevisao ?? 0;
              return { value: p.id, label: pendentes > 0 ? `${p.title} (${pendentes} em revisão)` : p.title };
            })}
          />
        </div>
        )}
        {!loadingProjetos && !projetoFinalizado && (
          <button type="button" className="advisor-botao advisor-botao--primario" onClick={() => abrirModal("nova")}>
            <Plus size={16} />
            Novo marco
          </button>
        )}
      </div>

      {loadingProjetos && (
        <div className="advisor-card-conteudo" aria-busy="true" aria-label="Carregando projeto">
          <Sk w="45%" h={16} />
          <Sk w={88} h={22} r="var(--raio-completo)" />
          <Sk w="60%" h={13} />
        </div>
      )}

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
              <span className="advisor-percentual">{resumo?.percentualGeral ?? 0}%</span>
              <div
                className="advisor-barra-progresso"
                style={{ width: 160 }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={resumo?.percentualGeral ?? 0}
                aria-label="Progresso geral do projeto"
              >
                <div className="advisor-barra-progresso__preenchimento" style={{ width: `${resumo?.percentualGeral ?? 0}%` }} />
              </div>
            </div>
          </div>
          <div className="advisor-linha-card__meta">
            {resumo && resumo.marcosTotal > 0
              ? `${resumo.itensConcluidos} de ${resumo.itensTotal} itens concluídos · ${resumo.marcosConcluidos} de ${resumo.marcosTotal} marcos aprovados`
              : "Nenhum marco cadastrado ainda."}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ChipsResumo resumo={resumo} />
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

      {listaMarcos.length > 0 && <FiltrosMarco valor={filtro} onChange={setFiltro} contagens={contagem} />}

      {loadingMarcos && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }} aria-busy="true" aria-label="Carregando marcos">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 96, borderRadius: "var(--raio-medio)" }} />
          ))}
        </div>
      )}

      {!loadingMarcos && erroMarcos && (
        <StatusView
          title="Falha ao carregar marcos"
          description={getErrorMessage(normalizeError(erroMarcos))}
          action={<button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => recarregar()}>Tentar novamente</button>}
        />
      )}

      {!loadingMarcos && !erroMarcos && listaMarcos.length === 0 && (
        <div className="advisor-estado-vazio" style={{ padding: "var(--espaco-6)" }}>
          <div className="advisor-estado-vazio__icone">
            <Calendar size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Sem marcos definidos</h3>
          <p className="advisor-estado-vazio__descricao">Crie o primeiro marco e adicione tarefas para acompanhar o progresso deste projeto.</p>
        </div>
      )}

      {!loadingMarcos && !erroMarcos && listaMarcos.length > 0 && marcosFiltrados.length === 0 && (
        <p className="advisor-etapas-grupo__vazio">Nenhum marco neste filtro.</p>
      )}

      {!loadingMarcos && !erroMarcos && marcosFiltrados.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
          {marcosFiltrados.map((marco) => (
            <AdvisorMarcoCard
              key={marco.id}
              marco={marco}
              indice={listaMarcos.indexOf(marco) + 1}
              primeiro={listaMarcos[0]?.id === marco.id}
              ultimo={listaMarcos[listaMarcos.length - 1]?.id === marco.id}
              acoes={acoes}
              abertoInicial={filtro === "revisao" ? true : undefined}
            />
          ))}
        </div>
      )}

      {modal && createPortal((
        <div
          className="advisor-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Gerenciar marcos"
          onKeyDown={(e) => { if (e.key === "Escape" && !mutando) fecharModal(); }}
        >
          <div className="advisor-modal">
            <div className="advisor-modal__cabecalho">
              <h3 className="advisor-modal__titulo">
                {modal.tipo === "nova" && "Novo marco"}
                {modal.tipo === "editar" && "Editar marco"}
                {modal.tipo === "excluir" && "Excluir marco"}
                {modal.tipo === "iniciar" && "Iniciar projeto"}
                {modal.tipo === "finalizar" && "Finalizar projeto"}
              </h3>
              <button type="button" className="advisor-modal__fechar" onClick={fecharModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            {modal.valores && (
              <MarcoForm defaultValues={modal.valores} comTarefas={modal.tipo === "nova"} onSubmit={salvarMarco} />
            )}

            {modal.tipo === "excluir" && (
              <div className="advisor-modal__corpo">
                <p style={{ fontSize: "var(--tamanho-base)", color: "var(--cor-texto-medio)", lineHeight: 1.6 }}>
                  Deseja excluir o marco <strong>{modal.marco?.titulo}</strong>? As tarefas e o histórico de revisões dele também serão removidos. Essa ação não poderá ser desfeita.
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
                  O projeto <strong>{projetoAtivo?.title}</strong> será finalizado. Todos os marcos obrigatórios precisam estar aprovados. Confirma?
                </p>
              </div>
            )}

            <div className="advisor-modal__rodape">
              <button type="button" className="advisor-botao advisor-botao--secundario" onClick={fecharModal} disabled={mutando}>
                Cancelar
              </button>
              <button
                type={modal.valores ? "submit" : "button"}
                form={modal.valores ? MARCO_FORM_ID : undefined}
                className={
                  modal.tipo === "excluir" || modal.tipo === "finalizar"
                    ? "advisor-botao advisor-botao--perigo"
                    : "advisor-botao advisor-botao--primario"
                }
                disabled={mutando}
                onClick={() => {
                  if (modal.tipo === "excluir") excluirMarco();
                  if (modal.tipo === "iniciar" || modal.tipo === "finalizar") mudarStatusProjeto();
                }}
              >
                {mutando
                  ? "Aguarde..."
                  : modal.tipo === "excluir"
                    ? "Excluir marco"
                    : modal.tipo === "iniciar"
                      ? "Iniciar projeto"
                      : modal.tipo === "finalizar"
                        ? "Finalizar projeto"
                        : modal.tipo === "editar"
                          ? "Salvar alterações"
                          : "Criar marco"}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </motion.div>
  );
}
