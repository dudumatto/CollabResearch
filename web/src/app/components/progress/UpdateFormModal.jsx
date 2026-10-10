import { useEffect } from "react";
import { createPortal } from "react-dom";
import { NotePencil, X } from "@phosphor-icons/react";
import "../LogoutConfirmModal.css";
import "./UpdateFormModal.css";

export function UpdateFormModal({ open, editing = false, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  // Portal em body: fora do contexto de empilhamento da página, o overlay cobre sidebar e topbar.
  return createPortal(
    <div
      className="logout-confirm__overlay"
      role="presentation"
      data-entering="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="logout-confirm__modal update-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-modal-title"
        data-entering="true"
      >
        <header className="update-modal__header">
          <div className="update-modal__icon" aria-hidden="true">
            <NotePencil size={22} />
          </div>
          <div className="update-modal__heading">
            <h2 id="update-modal-title" className="update-modal__title">
              {editing ? "Editar atualização" : "Nova atualização"}
            </h2>
            <p className="update-modal__desc">
              Relato narrativo do andamento. Não conclui nem reabre tarefas do checklist.
            </p>
          </div>
          <button type="button" className="update-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
