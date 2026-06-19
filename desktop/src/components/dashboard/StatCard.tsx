import { Card } from '../ui/Card'

export function StatCard({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <Card className="stat-card">
      <p>{label}</p>
      <strong>{value.toLocaleString('pt-BR')}</strong>
      {detail && <small>{detail}</small>}
    </Card>
  )
}
