import { UsersPage } from '../users/UsersPage'

export function AdminsPage() {
  return <UsersPage lockedRole="ADMIN" title="Administradores" />
}
