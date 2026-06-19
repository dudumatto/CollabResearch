import { NavLink } from 'react-router-dom'

const sections = [
  { label: 'Visao geral', items: [{ to: '/', label: 'Dashboard' }] },
  {
    label: 'Pessoas',
    items: [
      { to: '/usuarios', label: 'Usuarios' },
      { to: '/alunos', label: 'Alunos' },
      { to: '/orientadores', label: 'Orientadores' },
      { to: '/administradores', label: 'Administradores' },
    ],
  },
  {
    label: 'Pesquisa',
    items: [
      { to: '/projetos', label: 'Projetos' },
      { to: '/oportunidades', label: 'Oportunidades' },
      { to: '/inscricoes', label: 'Inscricoes' },
      { to: '/areas', label: 'Areas de pesquisa' },
      { to: '/documentos', label: 'Documentos' },
    ],
  },
  {
    label: 'Governanca',
    items: [
      { to: '/relatorios', label: 'Relatorios' },
      { to: '/auditoria', label: 'Auditoria' },
      { to: '/configuracoes', label: 'Configuracoes' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">CR</span>
        <div><strong>CollabResearch</strong><small>Admin Desktop</small></div>
      </div>
      <nav aria-label="Menu administrativo">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <p>{section.label}</p>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
