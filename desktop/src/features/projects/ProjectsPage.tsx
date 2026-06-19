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
import { OpportunityFormModal } from '../opportunities/OpportunityFormModal'
import { ProjectDetailsModal } from './ProjectDetailsModal'
import { projectsService } from './projectsService'
import type { Project, ProjectStatus } from './projectsTypes'

const tone = (status: ProjectStatus) => status === 'ABERTO' ? 'success' : status === 'EM_ANDAMENTO' ? 'info' : 'danger'

export function ProjectsPage({ forcedStatus, title = 'Projetos' }: { forcedStatus?: ProjectStatus; title?: string }) {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [status, setStatus] = useState<ProjectStatus | ''>(forcedStatus ?? '')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<Project>()
  const [editing, setEditing] = useState<Project | null | undefined>()
  const [removing, setRemoving] = useState<Project>()
  const { notify } = useToast()
  const load = async () => {
    try {
      setError('')
      setProjects((await projectsService.list(forcedStatus ?? (status || undefined))).content)
    } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [forcedStatus, status])

  const updateStatus = async (project: Project, nextStatus: ProjectStatus) => {
    try {
      await projectsService.setStatus(project.id, nextStatus)
      notify('Status do projeto atualizado.')
      await load()
    } catch (caught) { notify(errorMessage(caught), 'error') }
  }
  const remove = async () => {
    if (!removing) return
    try {
      await projectsService.remove(removing.id)
      setRemoving(undefined)
      notify('Projeto removido.')
      await load()
    } catch (caught) { notify(errorMessage(caught), 'error') }
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Pesquisa</p><h1>{title}</h1><p>Gerencie vagas, prazos e andamento das iniciativas.</p></div><Button onClick={() => setEditing(null)}>Novo projeto</Button></header>
      <Card>
        {!forcedStatus && <div className="filters"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | '')} options={[{ value: '', label: 'Todos' }, { value: 'ABERTO', label: 'Abertos' }, { value: 'EM_ANDAMENTO', label: 'Em andamento' }, { value: 'FINALIZADO', label: 'Finalizados' }]} /></div>}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !projects ? <LoadingState /> : !projects.length ? <EmptyState /> : (
          <Table><thead><tr><th>Projeto</th><th>Area</th><th>Tecnologias</th><th>Status</th><th>Limite</th><th className="actions">Acoes</th></tr></thead><tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td><strong>{project.titulo}</strong><small>{project.vagas} vaga(s)</small></td><td>{project.areaNome}</td><td>{project.tecnologias || '-'}</td><td><Badge tone={tone(project.status)}>{project.status}</Badge></td><td>{formatDate(project.dataLimiteInscricao)}</td>
                <td className="actions">
                  <Button variant="ghost" onClick={() => setDetail(project)}>Ver</Button>
                  <Button variant="ghost" onClick={() => setEditing(project)}>Editar</Button>
                  {project.status === 'ABERTO' && <Button variant="ghost" onClick={() => void updateStatus(project, 'EM_ANDAMENTO')}>Iniciar</Button>}
                  {project.status !== 'FINALIZADO' && <Button variant="ghost" onClick={() => void updateStatus(project, 'FINALIZADO')}>Finalizar</Button>}
                  <Button variant="ghost" onClick={() => setRemoving(project)}>Remover</Button>
                </td>
              </tr>
            ))}
          </tbody></Table>
        )}
      </Card>
      {detail && <ProjectDetailsModal project={detail} onClose={() => setDetail(undefined)} />}
      {editing !== undefined && <OpportunityFormModal project={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); notify('Projeto salvo.'); void load() }} />}
      {removing && <ConfirmDialog title="Remover projeto" message={`Deseja remover ${removing.titulo}?`} onClose={() => setRemoving(undefined)} onConfirm={() => void remove()} />}
    </div>
  )
}
