import { useLayoutEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, CheckCircle, Warning } from "@phosphor-icons/react";
import "./DashboardKit.css";

/* Encaixa o painel na altura da viewport sem rolagem. Usa CSS `zoom` (não
   `transform`): o navegador re-renderiza o texto na escala final, então fica
   nítido, e o layout refaz o fluxo mantendo proporção e responsividade.
   Se nem MIN_ZOOM couber (ou sem suporte a zoom), fluxo natural com rolagem. */
const MIN_ZOOM = 0.7;

function useFitZoom() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const dash = el?.parentElement;
    if (!el || !dash || !window.CSS?.supports?.("zoom", "1")) return undefined;

    const mq = window.matchMedia("(min-width: 640px)");
    let frame = 0;

    const metrics = () => {
      const cs = getComputedStyle(dash);
      return dash.clientHeight - parseFloat(cs.paddingTop || "0") - parseFloat(cs.paddingBottom || "0");
    };
    const height = () => el.getBoundingClientRect().height;

    // Solução determinística: sempre parte de zoom 1, então o mesmo tamanho de
    // viewport dá o mesmo zoom (sem biestabilidade entre dois layouts).
    const solve = () => {
      frame = 0;
      if (!mq.matches) {
        el.style.zoom = "";
        dash.style.overflowY = "";
        return;
      }
      const available = metrics();
      if (available <= 0) return;
      const at = (z) => {
        el.style.zoom = String(z);
        return height();
      };
      // maior zoom que cabe: busca binária (a altura cresce com o zoom, mas dá saltos
      // nos breakpoints, então iterar por proporção oscila; a busca sempre converge)
      let z = 1;
      if (at(1) > available) {
        if (at(MIN_ZOOM) > available) {
          z = 1; // nem o zoom mínimo cabe: tamanho legível + rolagem
        } else {
          let lo = MIN_ZOOM;
          let hi = 1;
          while (hi - lo > 0.005) {
            const mid = (lo + hi) / 2;
            if (at(mid) <= available) lo = mid;
            else hi = mid;
          }
          z = lo;
        }
      }
      at(z);
      dash.style.overflowY = height() > available ? "auto" : "hidden";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(solve);
    };
    // mudança só do conteúdo: re-resolve apenas se deixou de caber (nunca "sobe" o zoom)
    const onContent = () => {
      if (!mq.matches || frame) return;
      const available = metrics();
      if (height() > available && (parseFloat(el.style.zoom) || 1) > MIN_ZOOM) schedule();
    };

    solve();
    const roDash = new ResizeObserver(schedule);
    const roEl = new ResizeObserver(onContent);
    roDash.observe(dash);
    roEl.observe(el);
    mq.addEventListener?.("change", schedule);
    return () => {
      roDash.disconnect();
      roEl.disconnect();
      mq.removeEventListener?.("change", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

export function DashFit({ children }) {
  const ref = useFitZoom();
  return <div className="dash__ajuste" ref={ref}>{children}</div>;
}

function CardHeader({ icon: Icon, tone, title, trailing }) {
  return (
    <>
      {Icon && (
        <span className={`dash-card__selo dash-card__selo--${tone}`} aria-hidden="true">
          <Icon size={16} />
        </span>
      )}
      <h3 className="dash-card__titulo">{title}</h3>
      {trailing}
    </>
  );
}

/* O cartão nunca é um botão: ele costuma conter linhas clicáveis, e botão
   dentro de botão é HTML inválido. Quando há `onOpen`, só o cabeçalho é o
   controle que leva à listagem completa. */
export function DashCard({ icon, tone = "verde", title, caption, onOpen, openLabel, children, className = "" }) {
  const seta = onOpen ? <CaretRight size={18} className="dash-card__seta" aria-hidden="true" /> : null;

  return (
    <section className={`dash-card ${className}`}>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel ?? `Abrir ${title}`}
          className="dash-card__cabecalho dash-card__cabecalho--acionavel"
        >
          <CardHeader icon={icon} tone={tone} title={title} trailing={seta} />
        </button>
      ) : (
        <div className="dash-card__cabecalho">
          <CardHeader icon={icon} tone={tone} title={title} />
        </div>
      )}
      {caption && <p className="dash-card__legenda">{caption}</p>}
      {children && <div className="dash-card__corpo">{children}</div>}
    </section>
  );
}

/* O cartão de métrica não tem conteúdo interativo, então ele todo é o botão. */
export function DashMetric({ icon, tone = "verde", title, caption, value, onOpen, openLabel }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={openLabel ?? `Abrir ${title}`}
      className="dash-card dash-card--acionavel"
    >
      <span className="dash-card__cabecalho">
        <CardHeader
          icon={icon}
          tone={tone}
          title={title}
          trailing={<CaretRight size={18} className="dash-card__seta" aria-hidden="true" />}
        />
      </span>
      {caption && <span className="dash-card__legenda">{caption}</span>}
      <span className="dash-metrica__valor">{value}</span>
    </button>
  );
}

export function DashRow({ title, subtitle, badge, badgeTone = "neutro", avatar, trailing, onOpen, openLabel }) {
  const Root = onOpen ? "button" : "div";

  return (
    <Root
      {...(onOpen ? { type: "button", onClick: onOpen, "aria-label": openLabel ?? title } : {})}
      className={`dash-linha ${onOpen ? "dash-linha--acionavel" : ""}`}
    >
      {avatar}
      <span className="dash-linha__info">
        <span className="dash-linha__titulo">{title}</span>
        {subtitle && <span className="dash-linha__subtitulo">{subtitle}</span>}
      </span>
      {badge && <span className={`dash-selo dash-selo--${badgeTone}`}>{badge}</span>}
      {trailing && <span className="dash-linha__horario">{trailing}</span>}
    </Root>
  );
}

/* Envolve uma lista de DashRow: se ela exceder o limite exibido, corta a
   altura em 3 itens inteiros + metade do 4º (com fade) e sobrepõe o rótulo
   "Ver mais" — em vez de rolar. Sem excedente, renderiza a lista normalmente. */
export function DashListaCortada({ children, excedeLimite, onVerMais }) {
  if (!excedeLimite) return children;

  return (
    <div className="dash-lista-fade">
      <div className="dash-lista-fade__clip">{children}</div>
      <button type="button" className="dash-agenda-vermais" onClick={onVerMais}>
        Ver mais
      </button>
    </div>
  );
}

/* Lista de prazos com etiqueta de data (dia + mês), como a agenda do Figma. */
export function DashAgenda({ items, emptyLabel = "Nenhum prazo próximo." }) {
  if (!items || items.length === 0) return <DashEmpty>{emptyLabel}</DashEmpty>;

  return (
    <ol className="dash-agenda">
      {items.map((item) => (
        <li key={item.id} className="dash-agenda__item">
          <span className="dash-agenda__data" aria-hidden="true">
            <strong>{item.day}</strong>
            <small>{item.month}</small>
          </span>
          <span className="dash-linha__info">
            <span className="dash-linha__titulo">{item.title}</span>
            {item.subtitle && <span className="dash-linha__subtitulo">{item.subtitle}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* Destaque de um único prazo (o mais próximo), em tamanho maior e fixo —
   para o cartão "Calendário" quando ele deve mostrar só o item seguinte. */
export function DashAgendaDestaque({ item, emptyLabel = "Nenhum prazo próximo." }) {
  if (!item) return <DashEmpty>{emptyLabel}</DashEmpty>;

  return (
    <div className="dash-agenda-destaque">
      <span className="dash-agenda-destaque__data" aria-hidden="true">
        <strong>{item.day}</strong>
        <small>{item.month}</small>
      </span>
      <span className="dash-agenda-destaque__info">
        <span className="dash-agenda-destaque__titulo">{item.title}</span>
        {item.subtitle && <span className="dash-agenda-destaque__subtitulo">{item.subtitle}</span>}
      </span>
    </div>
  );
}

/* Barra de progresso do projeto com selo de estado e contagem de etapas. */
export function DashProgress({ status, statusTone = "azul", label, done = 0, total = 0, percent = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="dash-progresso">
      <div className="dash-progresso__topo">
        {label && <span className="dash-progresso__rotulo">{label}</span>}
        {status && <span className={`dash-selo dash-selo--${statusTone}`}>{status}</span>}
      </div>
      <div className="dash-progresso__trilho">
        <span className="dash-progresso__preenchido" style={{ width: `${pct}%` }} />
      </div>
      <div className="dash-progresso__legenda">
        <span>{done} de {total} etapas concluídas</span>
        <strong>{pct}%</strong>
      </div>
    </div>
  );
}

/* Bloco promocional centralizado (ex.: Comunidade). */
export function DashPromo({ children }) {
  return <p className="dash-promo">{children}</p>;
}

/* Etapas ainda não concluídas: ícone de alerta, título da etapa e projeto
   (o subtítulo longo some em fade à direita, como no Figma). */
export function DashPendentes({ items = [] }) {
  if (items.length === 0) return <DashEmpty>Nenhuma etapa pendente.</DashEmpty>;

  return (
    <ul className="dash-pendentes">
      {items.map((item) => (
        <li key={item.id} className="dash-pendentes__item">
          <Warning size={24} weight="fill" className="dash-pendentes__icone" aria-hidden="true" />
          <span className="dash-linha__info">
            <span className="dash-pendentes__titulo">{item.title}</span>
            <span className="dash-pendentes__subtitulo">{item.subtitle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashAvatar({ src, initials }) {
  if (src) return <img className="dash-linha__avatar" src={src} alt="" />;
  return <span className="dash-linha__avatar">{initials}</span>;
}

const formatNota = (value) =>
  Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDataAvaliacao(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("pt-BR") : "";
}

/* Carrossel de avaliações acadêmicas: mostra uma por vez e, havendo mais de
   uma, setas para alternar. A altura do corpo é fixa para o cartão não mudar. */
export function DashEvaluations({ items = [] }) {
  const [index, setIndex] = useState(0);
  if (items.length === 0) return <DashEmpty>Suas avaliações aparecerão aqui.</DashEmpty>;

  const current = items[Math.min(index, items.length - 1)];
  const go = (step) => setIndex((i) => (i + step + items.length) % items.length);
  const data = formatDataAvaliacao(current.criadaEm);
  const notas = [
    ["Participação", current.participacao],
    ["Qualidade técnica", current.qualidadeTecnica],
    ["Cumprimento de prazos", current.cumprimentoDePrazos],
    ["Comunicação", current.comunicacao],
  ];

  return (
    <div className="dash-aval">
      <div className="dash-aval__quem">
        <div className="dash-aval__nome">
          <strong>{current.alunoNome || current.orientadorNome || "Avaliação"}</strong>
          <span>{[current.etapaTitulo, data].filter(Boolean).join(" - ")}</span>
        </div>
        <span className="dash-aval__media">Média {formatNota(current.media)}</span>
      </div>
      <div className="dash-aval__direita">
        <div className="dash-aval__notas">
          {notas.map(([label, value]) => (
            <div className="dash-aval__nota" key={label}>
              <span>{label}</span>
              <strong>{formatNota(value)}</strong>
            </div>
          ))}
        </div>
        <div className="dash-aval__rodape">
          {current.comentarioOrientador && (
            <q className="dash-aval__comentario" title={current.comentarioOrientador}>
              {current.comentarioOrientador}
            </q>
          )}
          {items.length > 1 && (
            <div className="dash-aval__nav">
              <button type="button" onClick={() => go(-1)} aria-label="Avaliação anterior">
                <CaretLeft size={14} />
              </button>
              <span aria-live="polite">{Math.min(index, items.length - 1) + 1}/{items.length}</span>
              <button type="button" onClick={() => go(1)} aria-label="Próxima avaliação">
                <CaretRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashEmpty({ children = "Nada pendente por aqui." }) {
  return (
    <p className="dash-vazio">
      <CheckCircle size={16} aria-hidden="true" />
      {children}
    </p>
  );
}

export function DashSection({ title, description, children }) {
  return (
    <section className="dash-secao">
      <div>
        <h2 className="dash-secao__titulo">{title}</h2>
        {description && <p className="dash-secao__descricao">{description}</p>}
      </div>
      {children}
    </section>
  );
}
