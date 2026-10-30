import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BellRinging, Check, X } from "@phosphor-icons/react";
import { IaIcone } from "./ui/IaIcone";
import "./LogoutConfirmModal.css";
import "./LumenLoadingModal.css";

const STEP_MS = 2600;

const CONTEUDO = {
  recomendacao: {
    titulo: "Lumen está analisando",
    descricao: "Comparando seu perfil com os projetos abertos para encontrar os mais compatíveis com você.",
    etapas: ["Lendo seu perfil", "Comparando com os projetos abertos", "Selecionando os mais compatíveis"],
  },
  ranking: {
    titulo: "Lumen está avaliando",
    descricao: "Analisando as candidaturas e a compatibilidade de cada uma com o projeto.",
    etapas: ["Lendo as candidaturas", "Comparando com o projeto", "Gerando notas e ranking"],
  },
};

export function LumenLoadingModal({ open, onClose, tipo = "ranking" }) {
  const [etapa, setEtapa] = useState(0);
  const { titulo, descricao, etapas } = CONTEUDO[tipo] ?? CONTEUDO.ranking;

  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Avança as etapas visualmente; a última fica "em andamento" até a análise terminar.
  useEffect(() => {
    if (!open) return undefined;
    setEtapa(0);
    const id = setInterval(() => setEtapa((atual) => Math.min(atual + 1, etapas.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [open, tipo, etapas.length]);

  if (!open) return null;

  return createPortal(
    <div className="logout-confirm__overlay lumen-loading__overlay" role="presentation" data-entering="true">
      <div
        className="logout-confirm__modal lumen-loading__modal"
        role="alertdialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby="lumen-loading-title"
        aria-describedby="lumen-loading-description"
        data-entering="true"
      >
        {onClose && (
          <button type="button" className="lumen-loading__fechar" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        )}

        <div className="lumen-loading__orb ia-gatilho" aria-hidden="true">
          <span className="lumen-loading__orb-ring" />
          <span className="lumen-loading__orb-fill" />
          <IaIcone className="lumen-loading__orb-icon" size={30} />
        </div>

        <span className="lumen-loading__selo ia-gatilho">
          <IaIcone size={12} /> Lumen IA
        </span>
        <h2 id="lumen-loading-title" className="lumen-loading__titulo">
          {titulo}
          <span className="lumen-loading__reticencias" aria-hidden="true" />
        </h2>
        <p id="lumen-loading-description" className="lumen-loading__descricao">{descricao}</p>

        <ol className="lumen-loading__etapas" aria-live="polite">
          {etapas.map((texto, i) => {
            const estado = i < etapa ? "concluida" : i === etapa ? "ativa" : "pendente";
            return (
              <li key={texto} className={`lumen-loading__etapa lumen-loading__etapa--${estado}`}>
                <span className="lumen-loading__etapa-marcador" aria-hidden="true">
                  {estado === "concluida" ? <Check size={12} weight="bold" /> : <span />}
                </span>
                <span>{texto}</span>
              </li>
            );
          })}
        </ol>

        <div className="lumen-loading__barra" aria-hidden="true">
          <span />
        </div>

        <p className="lumen-loading__aviso">
          <BellRinging size={16} aria-hidden="true" />
          Pode continuar navegando. Avisaremos quando terminar.
        </p>

        {onClose && (
          <button type="button" className="lumen-loading__continuar" onClick={onClose}>
            Continuar navegando
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
