import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../lib/errors'
import type { UserRole } from '../auth/authTypes'
import { UserDetailsModal } from './UserDetailsModal'
import { UserFormModal } from './UserFormModal'
import { usersService } from './usersService'
import type { UserProfile } from './usersTypes'

export function UsersPage({ lockedRole, title = 'Usuarios' }: { lockedRole?: UserRole; title?: string }) {
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const [role, setRole] = useState<UserRole | ''>(lockedRole ?? '')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<UserProfile>()
  const [editing, setEditing] = useState<UserProfile | null | undefined>()
  const { notify } = useToast()

  const load = async () => {
    setError('')
    try {
      const page = await usersService.list(lockedRole ?? role, search)
      setUsers(page.content)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  useEffect(() => { void load() }, [lockedRole, role])

  const toggle = async (user: UserProfile) => {
    try {
      await usersService.setActive(user.id, !user.ativo)
      notify(`Usuario ${user.ativo ? 'desativado' : 'ativado'} com sucesso.`)
      await load()
    } catch (caught) {
      notify(errorMessage(caught), 'error')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">Pessoas</p><h1>{title}</h1><p>Cadastre perfis e controle acesso ao ambiente CollabResearch.</p></div>
        <Button onClick={() => setEditing(null)}>Novo cadastro</Button>
      </header>
      <Card>
        <form className="filters" onSubmit={(event) => { event.preventDefault(); void load() }}>
          <Input aria-label="Buscar usuario" placeholder="Buscar nome ou email" value={search} onChange={(event) => setSearch(event.target.value)} />
          {!lockedRole && <Select aria-label="Filtrar perfil" value={role} onChange={(event) => setRole(event.target.value as UserRole | '')} options={[
            { value: '', label: 'Todos os perfis' }, { value: 'ALUNO', label: 'Alunos' }, { value: 'ORIENTADOR', label: 'Orientadores' }, { value: 'ADMIN', label: 'Administradores' },
          ]} />}
          <Button variant="secondary" type="submit">Filtrar</Button>
        </form>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !users ? <LoadingState /> : !users.length ? <EmptyState /> : (
          <Table>
            <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th className="actions">Acoes</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.nome}</strong></td><td>{user.email}</td><td>{user.tipo}</td>
                <td><Badge tone={user.ativo ? 'success' : 'danger'}>{user.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                <td className="actions"><Button variant="ghost" onClick={() => setDetail(user)}>Ver</Button><Button variant="ghost" onClick={() => setEditing(user)}>Editar</Button><Button variant="ghost" onClick={() => void toggle(user)}>{user.ativo ? 'Desativar' : 'Ativar'}</Button></td>
              </tr>
            ))}</tbody>
          </Table>
        )}
      </Card>
      {detail && <UserDetailsModal user={detail} onClose={() => setDetail(undefined)} />}
      {editing !== undefined && <UserFormModal user={editing ?? undefined} initialRole={lockedRole} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); notify('Cadastro salvo com sucesso.'); void load() }} />}
    </div>
  )
}
