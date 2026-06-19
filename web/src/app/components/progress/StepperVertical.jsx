import { StepCard } from "./StepCard";

export function StepperVertical({ steps = [], currentUserRole, onAdvanceStep }) {
  return (
    <div className="stepper-vertical">
      {steps.map((step) => (
        <StepCard
          key={step.id}
          step={step}
          currentUserRole={currentUserRole}
          onAdvanceStep={onAdvanceStep}
        />
      ))}
    </div>
  );
}
