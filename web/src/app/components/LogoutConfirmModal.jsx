import { useEffect } from "react";
import { SignOut } from "@phosphor-icons/react";
import "./LogoutConfirmModal.css";

export function LogoutConfirmModal({ open, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="logout-confirm__overlay"
      role="presentation"
      data-entering="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="logout-confirm__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        data-entering="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="logout-confirm__icon" aria-hidden="true">
          <SignOut size={28} />
        </div>
        <h2 id="logout-confirm-title" className="logout-confirm__title">Sair da conta?</h2>
        <p id="logout-confirm-description" className="logout-confirm__desc">
          Você precisará fazer login novamente para acessar a plataforma.
        </p>
        <div className="logout-confirm__actions">
          <button type="button" className="logout-confirm__confirm" onClick={onConfirm}>
            Confirmar saída
          </button>
          <button type="button" className="logout-confirm__cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
