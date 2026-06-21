import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Telescope,
  ShieldCheck,
  FolderKanban,
  Sparkles,
  FileText,
  BookOpen,
  File,
  BarChart3,
  ScrollText,
  Settings,
} from 'lucide-react'

const sections = [
  {
    label: 'Visão geral',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Pessoas',
    items: [
      { to: '/usuarios', label: 'Usuários', icon: Users },
      { to: '/alunos', label: 'Alunos', icon: GraduationCap },
      { to: '/orientadores', label: 'Orientadores', icon: Telescope },
      { to: '/administradores', label: 'Administradores', icon: ShieldCheck },
    ],
  },
  {
    label: 'Pesquisa',
    items: [
      { to: '/projetos', label: 'Projetos', icon: FolderKanban },
      { to: '/oportunidades', label: 'Oportunidades', icon: Sparkles },
      { to: '/inscricoes', label: 'Inscrições', icon: FileText },
      { to: '/areas', label: 'Áreas de pesquisa', icon: BookOpen },
      { to: '/documentos', label: 'Documentos', icon: File },
    ],
  },
  {
    label: 'Governança',
    items: [
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
      { to: '/auditoria', label: 'Auditoria', icon: ScrollText },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <BookOpen size={18} strokeWidth={2.5} />
        </div>
        <div className="sidebar-brand-text">
          <strong>CollabResearch</strong>
          <span>Admin Desktop</span>
        </div>
      </div>

      <nav aria-label="Menu administrativo">
        {sections.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <p className="sidebar-section-label">{section.label}</p>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className="sidebar-link">
                <item.icon size={16} strokeWidth={1.8} className="sidebar-link-icon" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
