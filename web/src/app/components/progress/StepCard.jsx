import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { formatUserType } from "../../utils/formatters";

function canCompleteStep(step, currentUserRole) {
  const role = String(currentUserRole ?? "").toUpperCase();
  const order = Number(step.stepOrder ?? 0);

  if (role === "ORIENTADOR") {
    return [1, 5, 6].includes(order);
  }

  if (role === "ALUNO") {
    return [2, 3, 4, 6].includes(order);
  }

  return false;
}

export function StepCard({ step, currentUserRole, onAdvanceStep }) {
  const isDone = step.status === "DONE";
  const isActive = step.status === "ACTIVE";
  const canAdvance = isActive && canCompleteStep(step, currentUserRole);

  return (
    <article className={`step-card step-card--${step.status.toLowerCase()}`}>
      <div className="step-card__marker">
        {isDone ? <CheckCircle2 size={18} /> : isActive ? <PlayCircle size={18} /> : <span>{step.stepOrder}</span>}
      </div>

      <div className="step-card__content">
        <div className="step-card__header">
          <div>
            <p className="step-card__eyebrow">Etapa {step.stepOrder}</p>
            <h4 className="step-card__title">{step.title}</h4>
          </div>
          <span className="step-card__weight">+{step.weight}%</span>
        </div>

        {step.description ? <p className="step-card__description">{step.description}</p> : null}

        <div className="step-card__footer">
          <span className="step-card__status">
            {isDone ? "Concluída" : isActive ? "Ativa" : "Pendente"}
          </span>
          <span className="step-card__role">
            {isActive ? `Permite ${formatUserType(currentUserRole) || "participante"}` : ""}
          </span>
        </div>
      </div>

      {isActive ? (
        <button
          type="button"
          className="step-card__action"
          disabled={!canAdvance}
          title={canAdvance ? "Concluir etapa" : "Sem permissão para concluir esta etapa"}
          onClick={() => onAdvanceStep?.(step.id)}
        >
          {canAdvance ? "Concluir etapa" : <><Lock size={14} /> Bloqueado</>}
        </button>
      ) : null}
    </article>
  );
}
