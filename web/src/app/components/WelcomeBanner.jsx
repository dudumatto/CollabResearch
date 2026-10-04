import "./WelcomeBanner.css";

function formatToday() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function WelcomeBanner({ name, role, institution, summary, primaryAction, secondaryAction }) {
  const chip = [institution, role].filter(Boolean).join(" · ");

  return (
    <section className="banner-boas-vindas" aria-label="Resumo do painel">
      <span className="banner-boas-vindas__enfeite" aria-hidden="true" />
      <div className="banner-boas-vindas__conteudo">
        <p className="banner-boas-vindas__meta">
          {chip && <span className="banner-boas-vindas__chip">{chip}</span>}
          <span className="banner-boas-vindas__data">{formatToday()}</span>
        </p>
        <h2 className="banner-boas-vindas__titulo">
          Bem-vindo de volta, <span>{name || "pesquisador(a)"}</span>
        </h2>
        <p className="banner-boas-vindas__resumo">{summary}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="banner-boas-vindas__acoes">
          {secondaryAction && (
            <button type="button" className="banner-boas-vindas__botao" onClick={secondaryAction.onClick}>
              {secondaryAction.icon && <secondaryAction.icon size={14} aria-hidden="true" />}
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button type="button" className="banner-boas-vindas__botao" onClick={primaryAction.onClick}>
              {primaryAction.icon && <primaryAction.icon size={14} aria-hidden="true" />}
              {primaryAction.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
