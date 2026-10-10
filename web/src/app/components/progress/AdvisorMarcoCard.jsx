import { useId, useState } from "react";
import { ArrowDown, ArrowUp, CaretRight, CheckCircle, PencilSimple, Trash, ArrowUUpLeft } from "@phosphor-icons/react";
import { formatDate } from "../../utils/formatters";
import {
  Aviso, ChecklistItem, HistoricoToggle, MarcoChips, MarcoPrazo, MarcoProgresso, NovaTarefaForm, SecaoChecklist,
  ultimaDevolucao,
} from "./MarcoPartes";
import { estadoMarco, mensagemDeErro, precisaAtencao, tarefasDoOrientador, tarefasPessoais } from "./marcoUtils";

function PainelRevisao({ marco, onRevisar, ocupado }) {
  const id = useId();
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState("");

  const decidir = async (acao) => {
    const texto = comentario.trim();
    if (acao === "DEVOLVER" && !texto) {
      setErro("Explique o que precisa ser ajustado para devolver o marco.");
      return;
    }
    try {
      await onRevisar(marco, { acao, comentario: texto });
      setComentario("");
      setErro("");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível registrar a revisão."));
    }
  };

  return (
    <section className="marco-revisao" aria-labelledby={`${id}-titulo`}>
      <h5 id={`${id}-titulo`}>Aguardando sua revisão</h5>
      <p className="marco-secao__dica">O aluno enviou este marco. Aprove ou devolva com um comentário.</p>
      <label htmlFor={id} className="marco-revisao__rotulo">Comentário (obrigatório ao devolver)</label>
      <textarea
        id={id}
        className="marco-input marco-input--area"
        rows={3}
        maxLength={2000}
        value={comentario}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        onChange={(e) => { setComentario(e.target.value); setErro(""); }}
      />
      {erro ? <p id={`${id}-erro`} className="marco-erro" role="alert">{erro}</p> : null}
      <div className="marco-revisao__acoes">
        <button type="button" className="marco-btn marco-btn--sucesso" disabled={ocupado} onClick={() => decidir("APROVAR")}>
          <CheckCircle size={14} aria-hidden="true" /> Aprovar marco
        </button>
        <button type="button" className="marco-btn marco-btn--perigo-forte" disabled={ocupado} onClick={() => decidir("DEVOLVER")}>
          <ArrowUUpLeft size={14} aria-hidden="true" /> Devolver para ajustes
        </button>
      </div>
    </section>
  );
}

/**
 * Marco na visão do orientador. O que aparece depende das ações recebidas:
 * - acoes.editar/excluir/moverMarco: organização do marco
 * - acoes.adicionarTarefa/renomearTarefa/removerTarefa/moverTarefa/alterarObrigatoria: checklist do orientador
 * - acoes.revisar: aprovar/devolver quando `emRevisao`
 * - acoes.historico: histórico de revisões
 * Tarefas pessoais do aluno são sempre somente leitura.
 */
export function AdvisorMarcoCard({ marco, indice, primeiro, ultimo, acoes = {}, abertoInicial }) {
  const [aberto, setAberto] = useState(abertoInicial ?? Boolean(marco.emRevisao));
  const [ocupado, setOcupado] = useState(false);
  const painelId = useId();
  const estado = estadoMarco(marco);
  const doOrientador = tarefasDoOrientador(marco);
  const pessoais = tarefasPessoais(marco);
  const devolucao = ultimaDevolucao(marco);
  const editaTarefas = Boolean(acoes.adicionarTarefa);

  const executar = async (fn) => {
    setOcupado(true);
    try {
      return await fn();
    } finally {
      setOcupado(false);
    }
  };

  const classes = ["marco-card", `marco-card--${estado.chave}`];
  if (precisaAtencao(marco)) classes.push("marco-card--atencao");

  return (
    <article id={`marco-${marco.id}`} className={classes.join(" ")}>
      <div className="marco-card__topo">
        <div className="marco-card__titulo-bloco">
          <p className="marco-card__eyebrow">Marco {indice}</p>
          <h4 className="marco-card__titulo">
            <button type="button" className="marco-card__alternar" aria-expanded={aberto} aria-controls={painelId} onClick={() => setAberto((v) => !v)}>
              <CaretRight size={14} className="marco-card__seta" aria-hidden="true" />
              <span>{marco.titulo}</span>
            </button>
          </h4>
        </div>
        <div className="marco-card__chips"><MarcoChips marco={marco} /></div>
      </div>

      <MarcoProgresso marco={marco} />

      {(acoes.editar || acoes.excluir || acoes.moverMarco) ? (
        <div className="marco-card__ferramentas">
          {acoes.moverMarco ? (
            <>
              <button type="button" className="marco-btn marco-btn--icone" aria-label={`Subir marco ${marco.titulo}`} disabled={primeiro || ocupado} onClick={() => executar(() => acoes.moverMarco(marco, -1))}>
                <ArrowUp size={14} aria-hidden="true" />
              </button>
              <button type="button" className="marco-btn marco-btn--icone" aria-label={`Descer marco ${marco.titulo}`} disabled={ultimo || ocupado} onClick={() => executar(() => acoes.moverMarco(marco, 1))}>
                <ArrowDown size={14} aria-hidden="true" />
              </button>
            </>
          ) : null}
          {acoes.editar ? (
            <button type="button" className="marco-btn" onClick={() => acoes.editar(marco)}>
              <PencilSimple size={14} aria-hidden="true" /> Editar marco
            </button>
          ) : null}
          {acoes.excluir ? (
            <button type="button" className="marco-btn marco-btn--perigo" onClick={() => acoes.excluir(marco)}>
              <Trash size={14} aria-hidden="true" /> Excluir
            </button>
          ) : null}
        </div>
      ) : null}

      {marco.emRevisao && !aberto ? (
        <Aviso tom="info">O aluno enviou este marco e aguarda sua decisão.</Aviso>
      ) : null}

      {aberto ? (
        <div id={painelId} className="marco-card__corpo">
          <div className="marco-card__meta">
            <MarcoPrazo marco={marco} />
            {marco.status === "DONE" && marco.ultimaRevisao?.criadoEm ? (
              <span className="marco-meta">Aprovado em {formatDate(marco.ultimaRevisao.criadoEm)}</span>
            ) : null}
          </div>
          {marco.descricao ? <p className="marco-card__descricao">{marco.descricao}</p> : null}
          {devolucao ? (
            <Aviso tom="danger" titulo="Última devolução:">{devolucao.comentario || "Sem comentário registrado."}</Aviso>
          ) : null}

          {marco.emRevisao && acoes.revisar ? (
            <PainelRevisao marco={marco} ocupado={ocupado} onRevisar={(m, dados) => executar(() => acoes.revisar(m, dados))} />
          ) : null}

          <SecaoChecklist
            titulo="Tarefas do orientador"
            dica={editaTarefas ? "Você define, ordena e marca quais são obrigatórias. O aluno só as conclui." : undefined}
            tarefas={doOrientador}
            vazio="Nenhuma tarefa definida. Adicione tarefas para o aluno concluir."
          >
            {doOrientador.map((tarefa, i) => (
              <ChecklistItem
                key={tarefa.id}
                tarefa={tarefa}
                podeMarcar={false}
                ocupado={ocupado}
                onRename={editaTarefas ? (t, titulo) => executar(() => acoes.renomearTarefa(marco, t, titulo)) : undefined}
                onRemove={editaTarefas ? (t) => executar(() => acoes.removerTarefa(marco, t)) : undefined}
                onMove={editaTarefas && doOrientador.length > 1 ? (t, dir) => executar(() => acoes.moverTarefa(marco, doOrientador, t, dir)) : undefined}
                podePrimeiro={i === 0}
                podeUltimo={i === doOrientador.length - 1}
                onToggleObrigatoria={editaTarefas ? (t, valor) => executar(() => acoes.alterarObrigatoria(marco, t, valor)) : undefined}
              />
            ))}
          </SecaoChecklist>

          {editaTarefas ? (
            <NovaTarefaForm
              rotulo={`Nova tarefa no marco ${marco.titulo}`}
              placeholder="Nova tarefa para o aluno"
              comObrigatoria
              desabilitado={ocupado}
              onAdd={(dados) => executar(() => acoes.adicionarTarefa(marco, dados))}
            />
          ) : null}

          <SecaoChecklist
            titulo="Tarefas pessoais do aluno"
            dica="Somente leitura. Entram na contagem de itens do marco."
            tarefas={pessoais}
            vazio="O aluno não adicionou tarefas pessoais."
          >
            {pessoais.map((tarefa) => (
              <ChecklistItem key={tarefa.id} tarefa={tarefa} podeMarcar={false} />
            ))}
          </SecaoChecklist>

          {acoes.historico ? (
            <HistoricoToggle carregar={() => acoes.historico(marco)} chave={`${marco.ultimaRevisao?.id ?? marco.ultimaRevisao?.criadoEm ?? "-"}-${marco.status}-${marco.emRevisao}`} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
