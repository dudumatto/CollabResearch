import { useEffect, useState } from "react";

const RAIO = 56;
const VOLTA = 2 * Math.PI * RAIO;
const DURACAO_MS = 1400;

export function ProgressDonut({ percent = 0, title = "Progresso geral", subtitle = "" }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const [animado, setAnimado] = useState(0);

  // Anel e contador animam juntos até o percentual; reduced-motion pula direto ao valor.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAnimado(safePercent);
      return undefined;
    }
    let frame;
    let ini = null;
    const conta = (t) => {
      ini ??= t;
      const p = Math.min(1, (t - ini) / DURACAO_MS);
      setAnimado(safePercent * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(conta);
    };
    frame = requestAnimationFrame(conta);
    return () => cancelAnimationFrame(frame);
  }, [safePercent]);

  return (
    <div className="progress-donut">
      <div className="progress-donut__chart">
        <svg className="progress-donut__ring" viewBox="0 0 128 128" aria-hidden="true">
          <circle className="progress-donut__trilha" cx="64" cy="64" r={RAIO} />
          <circle
            className="progress-donut__valor"
            cx="64"
            cy="64"
            r={RAIO}
            strokeDasharray={VOLTA}
            strokeDashoffset={VOLTA * (1 - animado / 100)}
            visibility={animado > 0 ? "visible" : "hidden"}
          />
        </svg>
        <div className="progress-donut__center">
          <strong>{Math.round(animado)}%</strong>
          <span>concluído</span>
        </div>
      </div>
      <p className="progress-donut__title">{title}</p>
      {subtitle ? <p className="progress-donut__subtitle">{subtitle}</p> : null}
    </div>
  );
}
