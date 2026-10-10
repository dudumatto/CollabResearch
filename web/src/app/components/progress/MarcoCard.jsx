import { useId, useState } from "react";
import { ArrowDown, ArrowUp, CaretRight, DotsSixVertical, PaperPlaneTilt } from "@phosphor-icons/react";
import { formatDate } from "../../utils/formatters";
import {
  Aviso, ChecklistItem, HistoricoToggle, MarcoChips, MarcoPrazo, MarcoProgresso, NovaTarefaForm, SecaoChecklist,
  ultimaDevolucao,
} from "./MarcoPartes";
import {
  estadoMarco, obrigatoriasPendentes, precisaAtencao, tarefasDoOrientador, tarefasPessoais,
} from "./marcoUtils";

/**
 * Marco na visão do aluno: resumo (itens + percentual), checklist expansível,
 * tarefas pessoais editáveis e envio para revisão.
 * `acoes`: { alternar, adicionar, renomear, remover, enviar, historico }  (todas assíncronas)
 * `arrastar`: { ativo, arrastando, onDragStart, onDragEnter, onDragOver, onDragEnd, mover(dir), primeiro, ultimo }
 */
export function MarcoCard({ marco, indice, somenteLeitura, destacado, abertoInicial = false, acoes, arrastar }) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [ocupado, setOcupado] = useState(false);
  const painelId = useId();
  const estado = estadoMarco(marco);
  const doOrientador = tarefasDoOrientador(marco);
  const pessoais = tarefasPessoais(marco);
  const bloqueado = somenteLeitura || marco.status === "DONE" || marco.emRevisao;
  const faltam = obrigatoriasPendentes(marco);
  const devolucao = ultimaDevolucao(marco);
  const podeEnviar = !bloqueado && marco.itensTotal > 0 && faltam === 0;

  const executar = async (fn) => {
    setOcupado(true);
    try {
      return await fn();
    } finally {
      setOcupado(false);
    }
  };

  let motivoBloqueioEnvio = "";
  if (somenteLeitura) motivoBloqueioEnvio = "Projeto finalizado: apenas consulta.";
  else if (marco.status === "DONE") motivoBloqueioEnvio = "Marco já aprovado pelo orientador.";
  else if (marco.emRevisao) motivoBloqueioEnvio = "Aguardando a decisão do orientador.";
  else if (marco.itensTotal === 0) motivoBloqueioEnvio = "Adicione ao menos uma tarefa para enviar.";
  else if (faltam > 0) motivoBloqueioEnvio = `Conclua ${faltam === 1 ? "a tarefa obrigatória restante" : `as ${faltam} tarefas obrigatórias restantes`} para enviar.`;

  const classes = ["step-card", "marco-card", `marco-card--${estado.chave}`];
  if (precisaAtencao(marco)) classes.push("marco-card--atencao");
  if (arrastar?.arrastando) classes.push("step-card--dragging");
  if (destacado) classes.push("step-card--highlighted");

  return (
    <article
      id={`progress-step-${marco.id}`}
      className={classes.join(" ")}
      onDragEnter={arrastar?.ativo ? arrastar.onDragEnter : undefined}
      onDragOver={arrastar?.ativo ? arrastar.onDragOver : undefined}
      onDrop={arrastar?.ativo ? arrastar.onDragEnd : undefined}
    >
      <div className="marco-card__topo">
        {arrastar?.ativo ? (
          <div className="marco-card__mover">
            <span
              className="marco-card__alca"
              draggable
              title="Arraste para reordenar"
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(marco.id));
                const cartao = e.currentTarget.closest("article");
                if (cartao) e.dataTransfer.setDragImage(cartao, 16, 16);
                arrastar.onDragStart();
              }}
              onDragEnd={arrastar.onDragEnd}
            >
              <DotsSixVertical size={17} aria-hidden="true" />
              <span>Mover</span>
            </span>
            <button type="button" className="marco-btn marco-btn--icone" aria-label={`Subir marco ${marco.titulo}`} disabled={arrastar.primeiro} onClick={() => arrastar.mover(-1)}>
              <ArrowUp size={13} aria-hidden="true" />
            </button>
            <button type="button" className="marco-btn marco-btn--icone" aria-label={`Descer marco ${marco.titulo}`} disabled={arrastar.ultimo} onClick={() => arrastar.mover(1)}>
              <ArrowDown size={13} aria-hidden="true" />
            </button>
          </div>
        ) : null}

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

      {!aberto && devolucao ? (
        <Aviso tom="danger" titulo="Devolvido para ajustes:">{devolucao.comentario || "Veja os detalhes do marco."}</Aviso>
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
            <Aviso tom="danger" titulo={`Devolvido${devolucao.autorNome ? ` por ${devolucao.autorNome}` : ""}:`}>
              {devolucao.comentario || "Ajuste as pendências e envie novamente."}
            </Aviso>
          ) : null}
          {marco.emRevisao ? <Aviso tom="info">Marco enviado para revisão. As tarefas ficam bloqueadas até a decisão do orientador.</Aviso> : null}
          {marco.status === "DONE" ? <Aviso tom="ok">Marco aprovado pelo orientador.</Aviso> : null}

          <SecaoChecklist
            titulo="Tarefas do orientador"
            dica="Definidas pelo orientador. Você pode marcar como concluídas, mas não editar."
            tarefas={doOrientador}
            vazio="O orientador ainda não definiu tarefas para este marco."
          >
            {doOrientador.map((tarefa) => (
              <ChecklistItem
                key={tarefa.id}
                tarefa={tarefa}
                podeMarcar={!bloqueado}
                ocupado={ocupado}
                onToggle={(t, concluida) => acoes.alternar(marco, t, concluida)}
              />
            ))}
          </SecaoChecklist>

          <SecaoChecklist
            titulo="Minhas tarefas"
            dica="Pessoais: só você edita e remove. Contam no percentual, mas nunca são obrigatórias."
            tarefas={pessoais}
            vazio="Você ainda não adicionou tarefas pessoais."
          >
            {pessoais.map((tarefa) => (
              <ChecklistItem
                key={tarefa.id}
                tarefa={tarefa}
                podeMarcar={!bloqueado}
                ocupado={ocupado}
                onToggle={(t, concluida) => acoes.alternar(marco, t, concluida)}
                onRename={bloqueado ? undefined : (t, titulo) => executar(() => acoes.renomear(marco, t, titulo))}
                onRemove={bloqueado ? undefined : (t) => executar(() => acoes.remover(marco, t))}
              />
            ))}
          </SecaoChecklist>

          {!bloqueado ? (
            <NovaTarefaForm
              rotulo={`Nova tarefa pessoal no marco ${marco.titulo}`}
              placeholder="Nova tarefa pessoal"
              desabilitado={ocupado}
              onAdd={(dados) => executar(() => acoes.adicionar(marco, dados))}
            />
          ) : null}

          <div className="marco-card__rodape">
            <button
              type="button"
              className="marco-btn marco-btn--primario"
              disabled={!podeEnviar || ocupado}
              aria-describedby={motivoBloqueioEnvio ? `${painelId}-envio` : undefined}
              onClick={() => executar(() => acoes.enviar(marco))}
            >
              <PaperPlaneTilt size={14} aria-hidden="true" />
              {marco.status === "REJECTED" ? "Reenviar para revisão" : "Enviar para revisão"}
            </button>
            {motivoBloqueioEnvio ? <p id={`${painelId}-envio`} className="marco-secao__dica">{motivoBloqueioEnvio}</p> : null}
          </div>

          <HistoricoToggle carregar={() => acoes.historico(marco)} chave={`${marco.ultimaRevisao?.id ?? marco.ultimaRevisao?.criadoEm ?? "-"}-${marco.status}-${marco.emRevisao}`} />
        </div>
      ) : null}
    </article>
  );
}
