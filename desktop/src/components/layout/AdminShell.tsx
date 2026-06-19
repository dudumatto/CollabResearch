import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AdminShell() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-workspace">
        <Topbar />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
