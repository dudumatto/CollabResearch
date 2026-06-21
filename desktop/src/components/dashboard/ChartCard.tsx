import { BarChart3 } from 'lucide-react'

export function ChartCard({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const total = items.reduce((acc, item) => acc + item.value, 0)

  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <div className="chart-card-header-left">
          <div className="chart-card-icon">
            <BarChart3 size={16} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="chart-card-title">{title}</h3>
            <span className="chart-card-total">{total} no total</span>
          </div>
        </div>
      </header>
      <div className="chart-card-bars">
        {items.map((item) => (
          <div className="chart-bar-row" key={item.label}>
            <span className="chart-bar-label">{item.label}</span>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <strong className="chart-bar-value">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
