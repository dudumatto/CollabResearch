import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, ToggleLeft, Activity } from 'lucide-react'
import { formatDateTime } from '../../lib/date'
import { formatAuditDescription, formatAuditTitle } from '../../lib/auditFormatters'
import type { RecentAudit } from '../../features/dashboard/dashboardTypes'
import { EmptyState } from '../ui/EmptyState'

const actionMeta: Record<string, { icon: typeof PlusCircle; color: string; bg: string }> = {
  CRIAR: { icon: PlusCircle, color: '#16a34a', bg: '#f0fdf4' },
  ATUALIZAR: { icon: Edit, color: '#2563eb', bg: '#eef2ff' },
  REMOVER: { icon: Trash2, color: '#dc2626', bg: '#fef2f2' },
  VALIDAR: { icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
  REJEITAR: { icon: XCircle, color: '#e11d48', bg: '#fff1f2' },
  ALTERAR_STATUS: { icon: ToggleLeft, color: '#d97706', bg: '#fffbeb' },
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  const months = Math.floor(days / 30)
  return `há ${months}m`
}

function getActionMeta(action: string) {
  const key = action.trim().toUpperCase() as keyof typeof actionMeta
  return actionMeta[key] ?? { icon: Activity, color: '#6b7280', bg: '#f3f4f6' }
}

export function RecentActivity({ items }: { items: RecentAudit[] }) {
  return (
    <section className="activity-card">
      <header className="activity-card-header">
        <h3 className="activity-card-title">Atividade administrativa recente</h3>
      </header>
      {!items.length ? (
        <div className="activity-empty">
          <EmptyState message="Nenhuma ação administrativa registrada ainda." />
        </div>
      ) : (
        <div className="activity-list">
          {items.map((item) => {
            const meta = getActionMeta(item.acao)
            const Icon = meta.icon
            return (
              <div key={item.id} className="activity-item">
                <div className="activity-item-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={15} strokeWidth={2} />
                </div>
                <div className="activity-item-body">
                  <strong className="activity-item-title">{formatAuditTitle(item.acao, item.recurso)}</strong>
                  <p className="activity-item-desc">{formatAuditDescription(item.descricao)}</p>
                  <span className="activity-item-admin">{item.administrador}</span>
                </div>
                <time className="activity-item-time" title={formatDateTime(item.dataEvento)}>
                  {formatRelativeTime(item.dataEvento)}
                </time>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
