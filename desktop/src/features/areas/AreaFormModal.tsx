import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { errorMessage } from '../../lib/errors'
import { areasService } from './areasService'
import type { ResearchArea } from './areasTypes'

export function AreaFormModal({ area, onSaved, onClose }: { area?: ResearchArea; onSaved: () => void; onClose: () => void }) {
  const [nome, setNome] = useState(area?.nome ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (area) await areasService.update(area.id, { nome })
      else await areasService.create({ nome })
      onSaved()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={area ? 'Editar area' : 'Nova area de pesquisa'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Input label="Nome da area" required value={nome} onChange={(event) => setNome(event.target.value)} />
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button><Button disabled={busy} type="submit">Salvar</Button></div>
      </form>
    </Modal>
  )
}
