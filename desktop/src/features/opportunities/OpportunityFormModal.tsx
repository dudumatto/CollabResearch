import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { errorMessage } from '../../lib/errors'
import { areasService } from '../areas/areasService'
import type { ResearchArea } from '../areas/areasTypes'
import { projectsService } from '../projects/projectsService'
import type { Project } from '../projects/projectsTypes'

export function OpportunityFormModal({ project, onSaved, onClose }: { project?: Project; onSaved: () => void; onClose: () => void }) {
  const [areas, setAreas] = useState<ResearchArea[]>([])
  const [titulo, setTitulo] = useState(project?.titulo ?? '')
  const [areaId, setAreaId] = useState(String(project?.areaId ?? ''))
  const [vagas, setVagas] = useState(String(project?.vagas ?? 1))
  const [descricao, setDescricao] = useState(project?.descricao ?? '')
  const [requisitos, setRequisitos] = useState(project?.requisitos ?? '')
  const [tecnologias, setTecnologias] = useState(project?.tecnologias ?? '')
  const [limite, setLimite] = useState(project?.dataLimiteInscricao ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { areasService.list().then(setAreas).catch((caught) => setError(errorMessage(caught))) }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = { titulo, areaId: Number(areaId), vagas: Number(vagas), descricao, requisitos, tecnologias, dataLimiteInscricao: limite || undefined }
      if (project) await projectsService.update(project.id, payload)
      else await projectsService.create(payload)
      onSaved()
    } catch (caught) { setError(errorMessage(caught)) } finally { setBusy(false) }
  }

  return (
    <Modal title={project ? 'Editar projeto' : 'Nova oportunidade'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Input label="Titulo" required value={titulo} onChange={(event) => setTitulo(event.target.value)} />
        <Select label="Area" required value={areaId} onChange={(event) => setAreaId(event.target.value)} options={[{ label: 'Selecione', value: '' }, ...areas.map((area) => ({ label: area.nome, value: String(area.id) }))]} />
        <Input label="Vagas" type="number" min={1} required value={vagas} onChange={(event) => setVagas(event.target.value)} />
        <Input label="Inscricoes ate" type="date" value={limite} onChange={(event) => setLimite(event.target.value)} />
        <label className="field full"><span>Descricao</span><textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} /></label>
        <label className="field full"><span>Requisitos</span><textarea value={requisitos} onChange={(event) => setRequisitos(event.target.value)} /></label>
        <label className="field full"><span>Tecnologias e competencias</span><textarea value={tecnologias} onChange={(event) => setTecnologias(event.target.value)} placeholder="React, Spring Boot, PostgreSQL" /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>Salvar</Button></div>
      </form>
    </Modal>
  )
}
