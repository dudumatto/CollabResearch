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
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { documentsService } from './documentsService'
import type { DocumentItem, DocumentStatus } from './documentsTypes'

const tone = (status: DocumentStatus) => status === 'VERIFICADO' ? 'success' : status === 'REJEITADO' ? 'danger' : status === 'EM_ANALISE' ? 'warning' : 'info'

export function DocumentsPage() {
  const [items, setItems] = useState<DocumentItem[] | null>(null)
  const [status, setStatus] = useState<DocumentStatus | ''>('')
  const [preview, setPreview] = useState<DocumentItem>()
  const [removing, setRemoving] = useState<DocumentItem>()
  const [error, setError] = useState('')
  const { notify } = useToast()
  const load = async () => {
    try { setError(''); setItems((await documentsService.list(status || undefined)).content) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [status])
  const review = async (item: DocumentItem, next: DocumentStatus) => {
    try { await documentsService.setStatus(item.id, next); notify('Documento revisado.'); await load() } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  const download = async (item: DocumentItem) => {
    try {
      const url = URL.createObjectURL(await documentsService.download(item))
      const link = window.document.createElement('a')
      link.href = url
      link.download = item.nomeArquivo
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  const remove = async () => {
    if (!removing) return
    try { await documentsService.remove(removing.id); setRemoving(undefined); notify('Documento removido.'); await load() } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Conformidade</p><h1>Documentos</h1><p>Revise curriculos e historicos enviados por usuarios.</p></div></header>
      <Card>
        <div className="filters"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as DocumentStatus | '')} options={[{ value: '', label: 'Todos' }, { value: 'ENVIADO', label: 'Enviados' }, { value: 'EM_ANALISE', label: 'Em analise' }, { value: 'VERIFICADO', label: 'Verificados' }, { value: 'REJEITADO', label: 'Rejeitados' }]} /></div>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !items ? <LoadingState /> : !items.length ? <EmptyState /> : (
          <Table><thead><tr><th>Arquivo</th><th>Usuario</th><th>Tipo</th><th>Status</th><th>Envio</th><th className="actions">Acoes</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}><td><strong>{item.nomeArquivo}</strong></td><td>{item.usuarioNome}</td><td>{item.tipo}</td><td><Badge tone={tone(item.status)}>{item.status}</Badge></td><td>{formatDate(item.dataEnvio)}</td><td className="actions"><Button variant="ghost" onClick={() => setPreview(item)}>Preview</Button><Button variant="ghost" onClick={() => void download(item)}>Baixar</Button>{item.status !== 'VERIFICADO' && <Button variant="ghost" onClick={() => void review(item, 'VERIFICADO')}>Validar</Button>}{item.status !== 'REJEITADO' && <Button variant="ghost" onClick={() => void review(item, 'REJEITADO')}>Rejeitar</Button>}<Button variant="ghost" onClick={() => setRemoving(item)}>Remover</Button></td></tr>)}
          </tbody></Table>
        )}
      </Card>
      {preview && <DocumentPreviewModal document={preview} onClose={() => setPreview(undefined)} />}
      {removing && <ConfirmDialog title="Remover documento" message={`Remover ${removing.nomeArquivo} permanentemente?`} onClose={() => setRemoving(undefined)} onConfirm={() => void remove()} />}
    </div>
  )
}
