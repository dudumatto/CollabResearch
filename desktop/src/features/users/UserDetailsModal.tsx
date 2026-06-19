import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDate } from '../../lib/date'
import type { UserProfile } from './usersTypes'

export function UserDetailsModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  return (
    <Modal title="Detalhes do usuario" onClose={onClose}>
      <div className="details-grid">
        <div><small>Nome</small><strong>{user.nome}</strong></div>
        <div><small>Status</small><Badge tone={user.ativo ? 'success' : 'danger'}>{user.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
        <div><small>Email</small><strong>{user.email}</strong></div>
        <div><small>Perfil</small><strong>{user.tipo}</strong></div>
        <div><small>Cadastro</small><strong>{formatDate(user.dataCadastro)}</strong></div>
        <div><small>Instituicao</small><strong>{user.instituicao || '-'}</strong></div>
        {user.tipo === 'ALUNO' && <><div><small>RA</small><strong>{user.ra || '-'}</strong></div><div><small>Semestre</small><strong>{user.semestre || '-'}</strong></div></>}
        {user.tipo === 'ORIENTADOR' && <><div><small>Departamento</small><strong>{user.departamento || '-'}</strong></div><div><small>Titulacao</small><strong>{user.titulacao || '-'}</strong></div></>}
      </div>
    </Modal>
  )
}
