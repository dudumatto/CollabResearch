import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react'
import { authService } from '../../features/auth/authService'
import { authStore, useAuthStore } from '../../features/auth/authStore'

export function Topbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      authStore.clear()
      navigate('/login')
    }
  }

  const initials = user?.nome
    ? user.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'AD'

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} strokeWidth={1.8} className="topbar-search-icon" />
        <input type="text" placeholder="Buscar projetos, alunos, documentos..." readOnly />
        <span className="topbar-search-hint">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="topbar-notification" aria-label="Notificações">
          <Bell size={18} strokeWidth={1.8} />
          <span className="topbar-notification-dot" />
        </button>

        <div className="topbar-user" onClick={() => setMenuOpen(!menuOpen)} onBlur={() => setTimeout(() => setMenuOpen(false), 200)} tabIndex={0}>
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.nome}</span>
            <span className="topbar-user-role">Administrador</span>
          </div>
          <ChevronDown size={14} strokeWidth={1.8} className={`topbar-chevron ${menuOpen ? 'open' : ''}`} />

          {menuOpen && (
            <div className="topbar-dropdown">
              <button onClick={logout} className="topbar-dropdown-item">
                <LogOut size={15} strokeWidth={1.8} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
