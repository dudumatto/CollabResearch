import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash } from "@phosphor-icons/react";
import "./LogoutConfirmModal.css";

export function ConfirmDeleteModal({
  open,
  title = "Excluir item?",
  description = "Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar exclusão",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
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
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
        data-entering="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="logout-confirm__icon" aria-hidden="true">
          <Trash size={28} />
        </div>
        <h2 id="delete-confirm-title" className="logout-confirm__title">{title}</h2>
        <p id="delete-confirm-description" className="logout-confirm__desc">{description}</p>
        <div className="logout-confirm__actions">
          <button type="button" className="logout-confirm__confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="logout-confirm__cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
