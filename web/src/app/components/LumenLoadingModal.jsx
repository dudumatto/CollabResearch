import { createPortal } from "react-dom";
import { Sparkle } from "@phosphor-icons/react";
import "./LogoutConfirmModal.css";
import "./LumenLoadingModal.css";

export function LumenLoadingModal({ open, count = 0 }) {
  if (!open) return null;

  const descricao = count === 1
    ? "A Lumen está avaliando esta candidatura. Isso pode levar alguns segundos."
    : "A Lumen está avaliando as candidaturas. Isso pode levar alguns segundos.";

  return createPortal(
    <div className="logout-confirm__overlay" role="presentation" data-entering="true">
      <div
        className="logout-confirm__modal"
        role="alertdialog"
        aria-modal="true"
        aria-busy="true"
        aria-live="polite"
        aria-labelledby="lumen-loading-title"
        aria-describedby="lumen-loading-description"
        data-entering="true"
      >
        <div className="lumen-loading__icon" aria-hidden="true">
          <span className="lumen-loading__spinner" />
          <Sparkle size={28} weight="fill" />
        </div>
        <h2 id="lumen-loading-title" className="logout-confirm__title">Lumen analisando...</h2>
        <p id="lumen-loading-description" className="logout-confirm__desc" style={{ marginBottom: 0 }}>
          {descricao}
        </p>
      </div>
    </div>,
    document.body,
  );
}
