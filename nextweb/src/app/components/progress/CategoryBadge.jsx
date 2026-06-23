const CATEGORY_CONFIG = {
  progress: { label: "Progresso", color: "blue" },
  document: { label: "Documento", color: "purple" },
  meeting: { label: "Reunião", color: "green" },
  problem: { label: "Problema", color: "red" },
  milestone: { label: "Marco", color: "amber" },
};

export function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[String(category ?? "progress").toLowerCase()] ?? CATEGORY_CONFIG.progress;
  return (
    <span className={`progress-badge progress-badge--${config.color}`}>
      {config.label}
    </span>
  );
}

export { CATEGORY_CONFIG };
