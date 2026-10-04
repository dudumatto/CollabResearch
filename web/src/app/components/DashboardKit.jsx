import { useLayoutEffect, useRef, useState } from "react";
import { CaretRight, CheckCircle } from "@phosphor-icons/react";
import "./DashboardKit.css";

/* Em telas largas, encolhe o conteúdo do painel apenas o necessário para caber
   na altura da viewport — sem rolagem. Em telas menores, mantém escala 1 e deixa
   o fluxo natural (responsivo). O transform não altera o scrollHeight medido,
   então não há laço de realimentação. */
function useFitScale() {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    const dash = el?.parentElement;
    if (!el || !dash) return undefined;

    const mq = window.matchMedia("(min-width: 1024px)");
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!mq.matches) {
        setScale(1);
        return;
      }
      const cs = getComputedStyle(dash);
      const padY = parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");
      const available = dash.clientHeight - padY;
      const natural = el.scrollHeight;
      if (available <= 0 || natural <= 0) {
        setScale(1);
        return;
      }
      const next = Math.min(1, (available - 1) / natural);
      // histerese: ignora micro-variações para não oscilar quando a largura muda
      setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(dash);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    mq.addEventListener?.("change", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      mq.removeEventListener?.("change", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const style = scale < 1
    ? { transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%` }
    : undefined;

  return { ref, style };
}

export function DashFit({ children }) {
  const { ref, style } = useFitScale();
  return (
    <div className="dash__ajuste" ref={ref} style={style}>
      {children}
    </div>
  );
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
      {children}
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

export function DashAvatar({ src, initials }) {
  if (src) return <img className="dash-linha__avatar" src={src} alt="" />;
  return <span className="dash-linha__avatar">{initials}</span>;
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
