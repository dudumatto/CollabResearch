import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Table } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../lib/errors'
import { AreaFormModal } from './AreaFormModal'
import { areasService } from './areasService'
import type { ResearchArea } from './areasTypes'

export function AreasPage() {
  const [areas, setAreas] = useState<ResearchArea[] | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ResearchArea | null | undefined>()
  const [removing, setRemoving] = useState<ResearchArea>()
  const { notify } = useToast()
  const load = async () => {
    try { setError(''); setAreas(await areasService.list()) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [])
  const remove = async () => {
    if (!removing) return
    try {
      await areasService.remove(removing.id)
      notify('Area removida.')
      setRemoving(undefined)
      await load()
    } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Pesquisa</p><h1>Areas de pesquisa</h1><p>Organize os temas usados em projetos e oportunidades.</p></div><Button onClick={() => setEditing(null)}>Nova area</Button></header>
      <Card>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !areas ? <LoadingState /> : !areas.length ? <EmptyState /> : (
          <Table><thead><tr><th>Area</th><th>Curso relacionado</th><th className="actions">Acoes</th></tr></thead><tbody>
            {areas.map((area) => <tr key={area.id}><td><strong>{area.nome}</strong></td><td>{area.cursoNome || '-'}</td><td className="actions"><Button variant="ghost" onClick={() => setEditing(area)}>Editar</Button><Button variant="ghost" onClick={() => setRemoving(area)}>Remover</Button></td></tr>)}
          </tbody></Table>
        )}
      </Card>
      {editing !== undefined && <AreaFormModal area={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); notify('Area salva.'); void load() }} />}
      {removing && <ConfirmDialog title="Remover area" message={`Remover ${removing.nome}? Projetos vinculados podem impedir esta acao.`} onClose={() => setRemoving(undefined)} onConfirm={() => void remove()} />}
    </div>
  )
}
