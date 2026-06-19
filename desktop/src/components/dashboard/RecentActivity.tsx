import { formatDateTime } from '../../lib/date'
import { formatAuditDescription, formatAuditTitle } from '../../lib/auditFormatters'
import type { RecentAudit } from '../../features/dashboard/dashboardTypes'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

export function RecentActivity({ items }: { items: RecentAudit[] }) {
  return (
    <Card title="Atividade administrativa recente">
      {!items.length ? <EmptyState message="Nenhuma acao administrativa registrada ainda." /> : (
        <div className="activities">
          {items.map((item) => (
            <div key={item.id}>
              <strong>{formatAuditTitle(item.acao, item.recurso)}</strong>
              <p>{formatAuditDescription(item.descricao)} por {item.administrador}</p>
              <time>{formatDateTime(item.dataEvento)}</time>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
