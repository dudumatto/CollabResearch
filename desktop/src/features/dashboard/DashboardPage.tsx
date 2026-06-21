import { useEffect, useState } from 'react'
import { FlaskConical, Users, FolderKanban, FileText, FileSearch } from 'lucide-react'
import { ChartCard } from '../../components/dashboard/ChartCard'
import { RecentActivity } from '../../components/dashboard/RecentActivity'
import { StatCard } from '../../components/dashboard/StatCard'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuthStore } from '../../features/auth/authStore'
import { errorMessage } from '../../lib/errors'
import { dashboardService } from './dashboardService'
import type { DashboardSummary } from './dashboardTypes'

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

export function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      setData(await dashboardService.load())
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  useEffect(() => { void load() }, [])

  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!data) return <LoadingState label="Carregando indicadores administrativos..." />

  return (
    <div className="page">
      <section className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-banner-text">
            <p className="welcome-greeting">{greeting}, <strong>{user?.nome?.split(' ')[0]}</strong></p>
            <h2 className="welcome-title">Painel de Governança</h2>
            <p className="welcome-subtitle">Acompanhe a operação, aprovação e governança da plataforma de pesquisa.</p>
            <div className="welcome-metrics">
              <span><strong>{data.projetosAbertos}</strong> projetos ativos</span>
              <span className="welcome-metrics-sep" />
              <span><strong>{data.totalOrientadores}</strong> orientadores</span>
              <span className="welcome-metrics-sep" />
              <span><strong>{data.totalAlunos}</strong> alunos matriculados</span>
            </div>
            <div className="welcome-progress">
              <div className="welcome-progress-info">
                <span>Semestre 2026.1</span>
                <span>67% concluído</span>
              </div>
              <div className="welcome-progress-bar">
                <div className="welcome-progress-fill" style={{ width: '67%' }} />
              </div>
            </div>
          </div>
          <div className="welcome-banner-visual">
            <div className="welcome-banner-icon">
              <FlaskConical size={32} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard label="Usuários" value={data.totalUsuarios} detail={`${data.usuariosAtivos} ativos`} icon={Users} accent="blue" trend={12} />
        <StatCard label="Projetos" value={data.totalProjetos} detail={`${data.projetosAbertos} abertos`} icon={FolderKanban} accent="green" trend={8} />
        <StatCard label="Inscrições pendentes" value={data.inscricoesPendentes} icon={FileText} accent="amber" trend={-5} />
        <StatCard label="Documentos em análise" value={data.documentosEmAnalise} icon={FileSearch} accent="purple" trend={3} />
      </div>
      <div className="dashboard-grid">
        <ChartCard title="Usuarios por perfil" items={[
          { label: 'Alunos', value: data.totalAlunos },
          { label: 'Orientadores', value: data.totalOrientadores },
          { label: 'Administradores', value: data.totalAdministradores },
        ]} />
        <RecentActivity items={data.atividadesRecentes} />
      </div>
    </div>
  )
}
