export function ProgressDonut({ percent = 0, title = "Progresso geral", subtitle = "" }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="progress-donut">
      <div className="progress-donut__chart">
        <div
          className="progress-donut__ring"
          style={{ "--progress-percent": `${safePercent}%` }}
          aria-hidden="true"
        />
        <div className="progress-donut__center">
          <strong>{safePercent}%</strong>
          <span>concluído</span>
        </div>
      </div>
      <p className="progress-donut__title">{title}</p>
      {subtitle ? <p className="progress-donut__subtitle">{subtitle}</p> : null}
    </div>
  );
}
