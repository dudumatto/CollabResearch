import { FolderOpen, TrendingUp } from "lucide-react";
import "./WelcomeBanner.css";

function formatToday() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function WelcomeBanner({ name, summary, primaryAction, secondaryAction }) {
  return (
    <section className="welcome-banner" aria-label="Resumo do painel">
      <div className="welcome-banner__decoration" aria-hidden="true">
        <img src="/brand/logo-icon.svg" width={280} height={280} alt="" />
      </div>
      <div className="welcome-banner__content">
        <p className="welcome-banner__date">{formatToday()}</p>
        <div className="welcome-banner__greeting">
          <h2 className="welcome-banner__title">Olá, <span>{name || "pesquisador(a)"}</span></h2>
        </div>
        <p className="welcome-banner__summary">{summary}</p>
        {(primaryAction || secondaryAction) && (
          <div className="welcome-banner__actions">
            {primaryAction && (
              <button type="button" className="welcome-banner__button welcome-banner__button--primary" onClick={primaryAction.onClick}>
                <FolderOpen size={16} />
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button type="button" className="welcome-banner__button welcome-banner__button--secondary" onClick={secondaryAction.onClick}>
                <TrendingUp size={16} />
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
