import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import { formatDate } from '../../lib/date'
import { errorMessage } from '../../lib/errors'
import { applicationsService } from './applicationsService'
import type { Application, ApplicationStatus } from './applicationsTypes'

const tone = (status: ApplicationStatus) => status === 'APROVADO' ? 'success' : status === 'REJEITADO' ? 'danger' : 'warning'

export function ApplicationsPage() {
  const [items, setItems] = useState<Application[] | null>(null)
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<Application>()
  const { notify } = useToast()
  const load = async () => {
    try { setError(''); setItems((await applicationsService.list(status || undefined)).content) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [status])
  const decide = async (id: number, nextStatus: ApplicationStatus) => {
    try { await applicationsService.setStatus(id, nextStatus); notify('Inscricao atualizada.'); await load() } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  const remove = async () => {
    if (!removing) return
    try { await applicationsService.remove(removing.id); setRemoving(undefined); notify('Inscricao removida.'); await load() } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Pesquisa</p><h1>Inscricoes</h1><p>Avalie candidaturas e acompanhe decisoes.</p></div></header>
      <Card>
        <div className="filters"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus | '')} options={[{ value: '', label: 'Todas' }, { value: 'PENDENTE', label: 'Pendentes' }, { value: 'APROVADO', label: 'Aprovadas' }, { value: 'REJEITADO', label: 'Rejeitadas' }]} /></div>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !items ? <LoadingState /> : !items.length ? <EmptyState /> : (
          <Table><thead><tr><th>Aluno</th><th>Projeto</th><th>Enviada em</th><th>Status</th><th className="actions">Acoes</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}><td><strong>{item.alunoNome}</strong></td><td>{item.projetoTitulo}</td><td>{formatDate(item.dataInscricao)}</td><td><Badge tone={tone(item.status)}>{item.status}</Badge></td><td className="actions">{item.status !== 'APROVADO' && <Button variant="ghost" onClick={() => void decide(item.id, 'APROVADO')}>Aprovar</Button>}{item.status !== 'REJEITADO' && <Button variant="ghost" onClick={() => void decide(item.id, 'REJEITADO')}>Rejeitar</Button>}<Button variant="ghost" onClick={() => setRemoving(item)}>Remover</Button></td></tr>)}
          </tbody></Table>
        )}
      </Card>
      {removing && <ConfirmDialog title="Remover inscricao" message={`Remover a candidatura de ${removing.alunoNome}?`} onClose={() => setRemoving(undefined)} onConfirm={() => void remove()} />}
    </div>
  )
}
