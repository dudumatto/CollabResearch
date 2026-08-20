import { StepCard } from "./StepCard";

export function StepperVertical({ steps = [], currentUserRole, onAdvanceStep, onMoveStep }) {
  return (
    <div className="stepper-vertical">
      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          currentUserRole={currentUserRole}
          onAdvanceStep={onAdvanceStep}
          displayOrder={index + 1}
          canMoveUp={currentUserRole === "ALUNO" && index > 0}
          canMoveDown={currentUserRole === "ALUNO" && index < steps.length - 1}
          onMoveUp={() => onMoveStep?.(index, index - 1)}
          onMoveDown={() => onMoveStep?.(index, index + 1)}
        />
      ))}
    </div>
  );
}
