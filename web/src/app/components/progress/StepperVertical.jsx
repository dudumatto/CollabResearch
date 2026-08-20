import { useState } from "react";
import { StepCard } from "./StepCard";

export function StepperVertical({ steps = [], currentUserRole, onAdvanceStep, onReorderStep }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const canReorder = currentUserRole === "ALUNO" && steps.length > 1;

  const handleDragStart = (index) => {
    if (!canReorder) return;
    setDraggingIndex(index);
  };

  const handleDragEnter = (index) => {
    if (!canReorder || draggingIndex === null || draggingIndex === index) return;
    onReorderStep?.(draggingIndex, index);
    setDraggingIndex(index);
  };

  const handleDragOver = (event) => {
    if (!canReorder) return;
    event.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  return (
    <div className="stepper-vertical" aria-label="Progresso do projeto">
      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          currentUserRole={currentUserRole}
          onAdvanceStep={onAdvanceStep}
          displayOrder={index + 1}
          canReorder={canReorder}
          isDragging={draggingIndex === index}
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragOver={handleDragOver}
          onDrop={handleDragEnd}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
