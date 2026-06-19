import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ProgressDonut({ percent = 0, title = "Progresso geral", subtitle = "" }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="progress-donut">
      <div className="progress-donut__chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { value: safePercent },
                { value: 100 - safePercent },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#1f7a5a" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
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
