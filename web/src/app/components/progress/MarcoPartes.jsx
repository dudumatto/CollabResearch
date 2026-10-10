import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, CalendarBlank, Check, Lock, PencilSimple, Plus, Trash, User, WarningCircle, X,
} from "@phosphor-icons/react";
import { formatDate } from "../../utils/formatters";
import {
  FILTROS_MARCO, ROTULO_ACAO_REVISAO, TOM_ACAO_REVISAO, estadoMarco, mensagemDeErro, prazoVencido, textoItens,
} from "./marcoUtils";
import "./marcos.css";

export function MarcoChips({ marco }) {
  const estado = estadoMarco(marco);
  const vencido = prazoVencido(marco);
  return (
    <>
      <span className={`marco-chip marco-chip--${estado.tom}`}>{estado.rotulo}</span>
      {vencido ? (
        <span className="marco-chip marco-chip--danger">
          <WarningCircle size={12} weight="fill" aria-hidden="true" /> Prazo vencido
        </span>
      ) : null}
    </>
  );
}

export function MarcoPrazo({ marco }) {
  if (!marco?.prazo) return <span className="marco-meta">Sem prazo definido</span>;
  const vencido = prazoVencido(marco);
  return (
    <span className={`marco-meta${vencido ? " marco-meta--alerta" : ""}`}>
      <CalendarBlank size={13} aria-hidden="true" /> Prazo: {formatDate(marco.prazo)}
    </span>
  );
}

export function MarcoProgresso({ marco }) {
  const percentual = Math.max(0, Math.min(100, Number(marco?.percentual) || 0));
  return (
    <div className="marco-progresso">
      <div className="marco-progresso__linha">
        <span>{textoItens(marco)}</span>
        <strong>{percentual}%</strong>
      </div>
      <div
        className="marco-progresso__barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        aria-label={`Progresso do marco ${marco?.titulo ?? ""}`}
      >
        <span style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

export function Aviso({ tom = "info", children, titulo }) {
  return (
    <div className={`marco-aviso marco-aviso--${tom}`} role={tom === "danger" ? "alert" : "status"}>
      {titulo ? <strong>{titulo}</strong> : null}
      <span>{children}</span>
    </div>
  );
}

export function ultimaDevolucao(marco) {
  return marco?.status === "REJECTED" && marco.ultimaRevisao?.acao === "DEVOLVIDO" ? marco.ultimaRevisao : null;
}

/**
 * Item do checklist. Checkbox real; título editável só quando `onRename` é passado.
 * - podeMarcar: quem pode alternar `concluida` (aluno). Sem permissão o checkbox fica desabilitado, mas visível.
 * - onMove(+1|-1) / onToggleObrigatoria / onRemove / onRename: ações do dono da tarefa.
 */
export function ChecklistItem({ tarefa, podeMarcar, onToggle, onRename, onRemove, onMove, podePrimeiro, podeUltimo, onToggleObrigatoria, ocupado }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(tarefa.titulo);
  const [erro, setErro] = useState("");
  const campo = useRef(null);
  const pessoal = tarefa.origem === "ALUNO";

  useEffect(() => {
    if (editando) campo.current?.focus();
  }, [editando]);

  const salvar = async (event) => {
    event.preventDefault();
    const titulo = rascunho.trim();
    if (!titulo) {
      setErro("Informe o título da tarefa.");
      return;
    }
    if (titulo === tarefa.titulo) {
      setEditando(false);
      return;
    }
    try {
      await onRename(tarefa, titulo);
      setEditando(false);
      setErro("");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível renomear."));
    }
  };

  const cancelar = () => {
    setEditando(false);
    setRascunho(tarefa.titulo);
    setErro("");
  };

  const classes = ["marco-tarefa", pessoal ? "marco-tarefa--pessoal" : "marco-tarefa--orientador"];
  if (tarefa.concluida) classes.push("marco-tarefa--feita");

  return (
    <li className={classes.join(" ")}>
      {editando ? (
        <form className="marco-tarefa__edicao" onSubmit={salvar}>
          <input
            ref={campo}
            className="marco-input"
            value={rascunho}
            maxLength={160}
            aria-label={`Novo título da tarefa ${tarefa.titulo}`}
            aria-invalid={Boolean(erro)}
            onChange={(e) => { setRascunho(e.target.value); setErro(""); }}
            onKeyDown={(e) => { if (e.key === "Escape") cancelar(); }}
          />
          <button type="submit" className="marco-btn marco-btn--icone marco-btn--primario" aria-label="Salvar título" disabled={ocupado}>
            <Check size={14} aria-hidden="true" />
          </button>
          <button type="button" className="marco-btn marco-btn--icone" aria-label="Cancelar edição" onClick={cancelar}>
            <X size={14} aria-hidden="true" />
          </button>
          {erro ? <p className="marco-erro" role="alert">{erro}</p> : null}
        </form>
      ) : (
        <>
          <label className="marco-tarefa__rotulo">
            <input
              type="checkbox"
              checked={Boolean(tarefa.concluida)}
              disabled={!podeMarcar || ocupado}
              onChange={(e) => onToggle?.(tarefa, e.target.checked)}
            />
            <span className="marco-tarefa__texto">
              <span className="marco-tarefa__titulo">{tarefa.titulo}</span>
              <span className="marco-tarefa__meta">
                {pessoal ? (
                  <span className="marco-chip marco-chip--muted"><User size={11} aria-hidden="true" /> Pessoal</span>
                ) : tarefa.obrigatoria ? (
                  <span className="marco-chip marco-chip--warn">Obrigatória</span>
                ) : (
                  <span className="marco-chip marco-chip--muted">Opcional</span>
                )}
                {tarefa.concluida && tarefa.concluidaEm ? <span>Concluída em {formatDate(tarefa.concluidaEm)}</span> : null}
              </span>
            </span>
          </label>

          <div className="marco-tarefa__acoes">
            {onToggleObrigatoria ? (
              <label className="marco-tarefa__obrigatoria">
                <input
                  type="checkbox"
                  checked={Boolean(tarefa.obrigatoria)}
                  disabled={ocupado}
                  onChange={(e) => onToggleObrigatoria(tarefa, e.target.checked)}
                />
                Obrigatória
              </label>
            ) : null}
            {onMove ? (
              <>
                <button type="button" className="marco-btn marco-btn--icone" aria-label={`Subir tarefa ${tarefa.titulo}`} disabled={ocupado || podePrimeiro} onClick={() => onMove(tarefa, -1)}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" className="marco-btn marco-btn--icone" aria-label={`Descer tarefa ${tarefa.titulo}`} disabled={ocupado || podeUltimo} onClick={() => onMove(tarefa, 1)}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
              </>
            ) : null}
            {onRename ? (
              <button type="button" className="marco-btn marco-btn--icone" aria-label={`Editar tarefa ${tarefa.titulo}`} disabled={ocupado} onClick={() => setEditando(true)}>
                <PencilSimple size={14} aria-hidden="true" />
              </button>
            ) : null}
            {onRemove ? (
              <button type="button" className="marco-btn marco-btn--icone marco-btn--perigo" aria-label={`Remover tarefa ${tarefa.titulo}`} disabled={ocupado} onClick={() => onRemove(tarefa)}>
                <Trash size={14} aria-hidden="true" />
              </button>
            ) : null}
            {!pessoal && !onRename && !onToggleObrigatoria ? (
              <span className="marco-tarefa__trava" title="Definida pelo orientador">
                <Lock size={13} aria-hidden="true" />
                <span className="marco-sr">Definida pelo orientador</span>
              </span>
            ) : null}
          </div>
        </>
      )}
    </li>
  );
}

export function SecaoChecklist({ titulo, dica, tarefas, vazio, children }) {
  const feitas = tarefas.filter((t) => t.concluida).length;
  return (
    <section className="marco-secao" aria-label={titulo}>
      <header className="marco-secao__cabecalho">
        <h5>{titulo}</h5>
        {tarefas.length ? <span>{feitas} de {tarefas.length} concluídas</span> : null}
      </header>
      {dica ? <p className="marco-secao__dica">{dica}</p> : null}
      {tarefas.length ? <ul className="marco-tarefas">{children}</ul> : <p className="marco-secao__vazio">{vazio}</p>}
    </section>
  );
}

export function NovaTarefaForm({ rotulo, placeholder, comObrigatoria = false, onAdd, desabilitado }) {
  const id = useId();
  const [titulo, setTitulo] = useState("");
  const [obrigatoria, setObrigatoria] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    const limpo = titulo.trim();
    if (!limpo) {
      setErro("Informe o título da tarefa.");
      return;
    }
    setEnviando(true);
    try {
      await onAdd({ titulo: limpo, obrigatoria: comObrigatoria ? obrigatoria : false });
      setTitulo("");
      setObrigatoria(false);
      setErro("");
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível adicionar a tarefa."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="marco-nova-tarefa" onSubmit={enviar} noValidate>
      <label htmlFor={id} className="marco-sr">{rotulo}</label>
      <div className="marco-nova-tarefa__linha">
        <input
          id={id}
          className="marco-input"
          value={titulo}
          maxLength={160}
          placeholder={placeholder}
          disabled={desabilitado || enviando}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          onChange={(e) => { setTitulo(e.target.value); setErro(""); }}
        />
        <button type="submit" className="marco-btn marco-btn--primario" disabled={desabilitado || enviando}>
          <Plus size={14} aria-hidden="true" /> {enviando ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {comObrigatoria ? (
        <label className="marco-tarefa__obrigatoria">
          <input type="checkbox" checked={obrigatoria} disabled={desabilitado || enviando} onChange={(e) => setObrigatoria(e.target.checked)} />
          Tarefa obrigatória para enviar o marco à revisão
        </label>
      ) : null}
      {erro ? <p id={`${id}-erro`} className="marco-erro" role="alert">{erro}</p> : null}
    </form>
  );
}

export function RevisaoHistorico({ carregar, chave }) {
  const [estado, setEstado] = useState({ loading: true, erro: null, itens: [] });
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;

  useEffect(() => {
    let ativo = true;
    carregarRef.current()
      .then((itens) => ativo && setEstado({ loading: false, erro: null, itens: Array.isArray(itens) ? itens : [] }))
      .catch((erro) => ativo && setEstado({ loading: false, erro, itens: [] }));
    return () => { ativo = false; };
  }, [chave]);

  if (estado.loading) return <p className="marco-secao__vazio" role="status">Carregando histórico...</p>;
  if (estado.erro) return <p className="marco-erro" role="alert">{mensagemDeErro(estado.erro, "Não foi possível carregar o histórico.")}</p>;
  if (!estado.itens.length) return <p className="marco-secao__vazio">Nenhuma revisão registrada ainda.</p>;

  return (
    <ol className="marco-historico">
      {estado.itens.map((item) => (
        <li key={item.id} className="marco-historico__item">
          <div className="marco-historico__topo">
            <span className={`marco-chip marco-chip--${TOM_ACAO_REVISAO[item.acao] ?? "muted"}`}>
              {ROTULO_ACAO_REVISAO[item.acao] ?? item.acao}
            </span>
            <span className="marco-meta">
              {item.autorNome ? `${item.autorNome} · ` : ""}{item.criadoEm ? formatDate(item.criadoEm) : ""}
            </span>
          </div>
          {item.comentario ? <p>{item.comentario}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function HistoricoToggle({ carregar, chave }) {
  const [aberto, setAberto] = useState(false);
  const id = useId();
  return (
    <div className="marco-historico-bloco">
      <button type="button" className="marco-btn" aria-expanded={aberto} aria-controls={id} onClick={() => setAberto((v) => !v)}>
        {aberto ? "Ocultar histórico de revisões" : "Ver histórico de revisões"}
      </button>
      {aberto ? <div id={id}><RevisaoHistorico carregar={carregar} chave={chave} /></div> : null}
    </div>
  );
}

export function FiltrosMarco({ valor, onChange, contagens }) {
  return (
    <div className="marco-filtros" role="group" aria-label="Filtrar marcos">
      {FILTROS_MARCO.map((filtro) => (
        <button key={filtro.id} type="button" className="marco-filtro" aria-pressed={valor === filtro.id} onClick={() => onChange(filtro.id)}>
          {filtro.rotulo}
          <span className={`marco-filtro__contador${filtro.id === "atencao" && contagens[filtro.id] > 0 && valor !== filtro.id ? " marco-filtro__contador--alerta" : ""}`}>
            {contagens[filtro.id] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
