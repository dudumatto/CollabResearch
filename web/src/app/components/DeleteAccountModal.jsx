import { useEffect, useState } from "react";
import { Trash } from "@phosphor-icons/react";
import "./LogoutConfirmModal.css";
import "./DeleteAccountModal.css";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

export function DeleteAccountModal({ open, expectedName, expectedEmail, onConfirm, onCancel }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNome("");
      setEmail("");
      setDeleting(false);
      return undefined;
    }
    const handleEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  const matches =
    normalize(nome) === normalize(expectedName) &&
    normalize(email) === normalize(expectedEmail);

  const handleConfirm = async () => {
    if (!matches || deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

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
        className="logout-confirm__modal excluir-conta__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="excluir-conta-title"
        aria-describedby="excluir-conta-description"
        data-entering="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="logout-confirm__icon" aria-hidden="true">
          <Trash size={28} />
        </div>
        <h2 id="excluir-conta-title" className="logout-confirm__title">Excluir sua conta?</h2>
        <p id="excluir-conta-description" className="logout-confirm__desc">
          Esta ação é permanente. Para confirmar, digite seu nome completo e e-mail exatamente
          como estão cadastrados.
        </p>

        <div className="excluir-conta__campos">
          <label className="excluir-conta__grupo">
            <span className="excluir-conta__rotulo">Nome completo</span>
            <input
              className="excluir-conta__input"
              type="text"
              value={nome}
              autoComplete="off"
              onChange={(event) => setNome(event.target.value)}
            />
          </label>
          <label className="excluir-conta__grupo">
            <span className="excluir-conta__rotulo">E-mail</span>
            <input
              className="excluir-conta__input"
              type="email"
              value={email}
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        </div>

        <div className="logout-confirm__actions">
          <button
            type="button"
            className="logout-confirm__confirm"
            onClick={handleConfirm}
            disabled={!matches || deleting}
          >
            {deleting ? "Excluindo..." : "Excluir conta permanentemente"}
          </button>
          <button type="button" className="logout-confirm__cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
