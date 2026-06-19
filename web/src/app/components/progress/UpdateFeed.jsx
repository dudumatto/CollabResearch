import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock3, UserCircle2 } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { formatUserType } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function UpdateFeed({ updates = [] }) {
  const [expandedIds, setExpandedIds] = useState([]);

  const toggle = (id) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const emptyState = useMemo(
    () => (
      <div className="update-feed__empty">
        <p>Nenhuma atualização foi publicada ainda.</p>
      </div>
    ),
    [],
  );

  if (updates.length === 0) {
    return emptyState;
  }

  return (
    <div className="update-feed">
      {updates.map((update) => {
        const isExpanded = expandedIds.includes(update.id);
        const shouldTruncate = Boolean(update.description) && update.description.length > 160;

        return (
          <article key={update.id} className="update-feed__item">
            <div className="update-feed__header">
              <div className="update-feed__author">
                <div className="update-feed__avatar">
                  <UserCircle2 size={18} />
                </div>
                <div>
                  <strong>{update.createdBy?.nome ?? "Usuário"}</strong>
                  <span>{formatUserType(update.createdBy?.tipo)}</span>
                </div>
              </div>
              <CategoryBadge category={update.category} />
            </div>

            <h4 className="update-feed__title">{update.title}</h4>

            {update.description ? (
              <div className="update-feed__body">
                <p className={isExpanded || !shouldTruncate ? "update-feed__description" : "update-feed__description update-feed__description--clamped"}>
                  {update.description}
                </p>
                {shouldTruncate ? (
                  <button type="button" className="update-feed__toggle" onClick={() => toggle(update.id)}>
                    {isExpanded ? <><ChevronUp size={14} /> Menos</> : <><ChevronDown size={14} /> Mais</>}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="update-feed__meta">
              {update.stepTitle ? (
                <span className="update-feed__step">Etapa: {update.stepTitle}</span>
              ) : null}
              {update.stepContribution != null ? (
                <span className="update-feed__contribution">+{update.stepContribution}% dentro da etapa</span>
              ) : null}
              <span className="update-feed__date">
                <Clock3 size={13} /> {formatDate(update.createdAt)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
