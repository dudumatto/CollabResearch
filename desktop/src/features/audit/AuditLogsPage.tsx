import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Table } from '../../components/ui/Table'
import { formatAuditAction, formatAuditDescription, formatAuditResource } from '../../lib/auditFormatters'
import { formatDateTime } from '../../lib/date'
import { errorMessage } from '../../lib/errors'
import { auditService } from './auditService'
import type { AuditLog } from './auditTypes'

export function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[] | null>(null)
  const [error, setError] = useState('')
  const load = async () => {
    try { setError(''); setItems((await auditService.list()).content) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [])
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Governanca</p><h1>Auditoria</h1><p>Trilha de alteracoes feitas pelos administradores.</p></div></header>
      <Card>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !items ? <LoadingState /> : !items.length ? <EmptyState message="Ainda nao ha alteracoes administrativas registradas." /> : (
          <Table><thead><tr><th>Data</th><th>Administrador</th><th>Acao</th><th>Recurso</th><th>Descricao</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}><td>{formatDateTime(item.dataEvento)}</td><td>{item.administrador}</td><td><Badge tone="info">{formatAuditAction(item.acao)}</Badge></td><td>{formatAuditResource(item.recurso)}{item.recursoId ? ` #${item.recursoId}` : ''}</td><td>{item.descricao ? formatAuditDescription(item.descricao) : '-'}</td></tr>)}
          </tbody></Table>
        )}
      </Card>
    </div>
  )
}
