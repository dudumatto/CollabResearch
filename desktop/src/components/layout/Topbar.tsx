import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { authService } from '../../features/auth/authService'
import { authStore, useAuthStore } from '../../features/auth/authStore'

export function Topbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      authStore.clear()
      navigate('/login')
    }
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Painel administrativo</p>
        <strong>Bem-vindo, {user?.nome}</strong>
      </div>
      <div className="profile-chip">
        <span>{user?.email}</span>
        <Button variant="secondary" onClick={logout}>Sair</Button>
      </div>
    </header>
  )
}
