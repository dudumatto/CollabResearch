import { Card } from '../ui/Card'

export function ChartCard({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <Card title={title}>
      <div className="bars">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div><i style={{ width: `${(item.value / max) * 100}%` }} /></div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}
