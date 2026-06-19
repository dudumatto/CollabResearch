import { createHashRouter } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { UsersPage } from '../features/users/UsersPage'
import { StudentsPage } from '../features/students/StudentsPage'
import { AdvisorsPage } from '../features/advisors/AdvisorsPage'
import { AdminsPage } from '../features/admins/AdminsPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { OpportunitiesPage } from '../features/opportunities/OpportunitiesPage'
import { ApplicationsPage } from '../features/applications/ApplicationsPage'
import { AreasPage } from '../features/areas/AreasPage'
import { DocumentsPage } from '../features/documents/DocumentsPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { AuditLogsPage } from '../features/audit/AuditLogsPage'
import { SettingsPage } from '../features/settings/SettingsPage'

export const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AdminShell />,
      children: [
        { path: '/', element: <DashboardPage /> },
        { path: '/usuarios', element: <UsersPage /> },
        { path: '/alunos', element: <StudentsPage /> },
        { path: '/orientadores', element: <AdvisorsPage /> },
        { path: '/administradores', element: <AdminsPage /> },
        { path: '/projetos', element: <ProjectsPage /> },
        { path: '/oportunidades', element: <OpportunitiesPage /> },
        { path: '/inscricoes', element: <ApplicationsPage /> },
        { path: '/areas', element: <AreasPage /> },
        { path: '/documentos', element: <DocumentsPage /> },
        { path: '/relatorios', element: <ReportsPage /> },
        { path: '/auditoria', element: <AuditLogsPage /> },
        { path: '/configuracoes', element: <SettingsPage /> },
      ],
    }],
  },
])
