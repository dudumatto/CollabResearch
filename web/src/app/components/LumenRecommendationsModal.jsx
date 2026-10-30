import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X, ArrowRight } from "@phosphor-icons/react";
import { IaIcone } from "./ui/IaIcone";
import "./LogoutConfirmModal.css";
import "./LumenLoadingModal.css";
import "./LumenRecommendationsModal.css";

export function LumenRecommendationsModal({ open, recomendacoes = [], aviso, onClose, onOpenProject }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const total = recomendacoes.length;

  return createPortal(
    <div className="logout-confirm__overlay lumen-loading__overlay" role="presentation" data-entering="true">
      <div
        className="logout-confirm__modal lumen-loading__modal lumen-recs__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lumen-recomendacoes-titulo"
        aria-describedby="lumen-recomendacoes-descricao"
        data-entering="true"
      >
        <button type="button" className="lumen-loading__fechar" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <header className="lumen-recs__cabecalho">
          <div className="lumen-loading__orb lumen-recs__orb ia-gatilho" aria-hidden="true">
            <span className="lumen-loading__orb-ring" />
            <span className="lumen-loading__orb-fill" />
            <IaIcone className="lumen-recs__orb-icon" size={26} />
          </div>
          <span className="lumen-loading__selo ia-gatilho">
            <IaIcone size={12} /> Lumen IA
          </span>
          <h2 id="lumen-recomendacoes-titulo" className="lumen-loading__titulo">Projetos recomendados pela Lumen</h2>
          <p id="lumen-recomendacoes-descricao" className="lumen-loading__descricao lumen-recs__descricao">
            {total > 0
              ? `${total === 1 ? "Encontramos 1 projeto compatível" : `Encontramos ${total} projetos compatíveis`} com o seu perfil.`
              : "Nenhum projeto aberto combina com o seu perfil no momento."}
          </p>
        </header>

        {total > 0 && (
          <ol className="lumen-recs__lista">
            {recomendacoes.map((r, i) => (
              <li
                key={r.projetoId}
                className={`advisor-lumen__card lumen-recs__card${i === 0 ? " lumen-recs__card--destaque" : ""}`}
                style={{ "--lumen-recs-ordem": i }}
              >
                <div className="lumen-recs__card-topo">
                  <span className="lumen-recs__posicao" aria-label={`${i + 1}º lugar`}>{i + 1}º</span>
                  <div className="lumen-recs__card-titulos">
                    <strong className="lumen-recs__nome" title={r.titulo}>{r.titulo}</strong>
                    {r.area && <span className="lumen-recs__area">{r.area}</span>}
                  </div>
                </div>
                <p className="lumen-recs__texto">{r.justificativa || "Sem justificativa informada."}</p>
                <button type="button" className="lumen-recs__ver" onClick={() => onOpenProject(r.projetoId)}>
                  Ver projeto <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}

        <p className="lumen-loading__aviso lumen-recs__aviso">
          <Info size={16} aria-hidden="true" />
          {aviso || "Sugestão gerada por IA. Avalie cada projeto antes de se inscrever."}
        </p>

        <button type="button" className="lumen-loading__continuar" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default LumenRecommendationsModal;
