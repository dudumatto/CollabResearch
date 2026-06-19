import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDate } from '../../lib/date'
import type { Project } from './projectsTypes'

const tone = (status: Project['status']) => status === 'ABERTO' ? 'success' : status === 'EM_ANDAMENTO' ? 'info' : 'danger'

export function ProjectDetailsModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <Modal title="Detalhes do projeto" onClose={onClose}>
      <div className="details-grid">
        <div className="full"><small>Titulo</small><strong>{project.titulo}</strong></div>
        <div><small>Status</small><Badge tone={tone(project.status)}>{project.status}</Badge></div>
        <div><small>Area</small><strong>{project.areaNome}</strong></div>
        <div><small>Vagas</small><strong>{project.vagas}</strong></div>
        <div><small>Limite de inscricao</small><strong>{formatDate(project.dataLimiteInscricao)}</strong></div>
        <div><small>Orientador</small><strong>{project.orientadorNome || '-'}</strong></div>
        <div><small>Criador</small><strong>{project.alunoCriadorNome || '-'}</strong></div>
        <div className="full"><small>Descricao</small><p>{project.descricao || '-'}</p></div>
        <div className="full"><small>Requisitos</small><p>{project.requisitos || '-'}</p></div>
        <div className="full"><small>Tecnologias e competencias</small><p>{project.tecnologias || '-'}</p></div>
      </div>
    </Modal>
  )
}
