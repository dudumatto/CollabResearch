import { useEffect, useState } from 'react'
import { ChartCard } from '../../components/dashboard/ChartCard'
import { RecentActivity } from '../../components/dashboard/RecentActivity'
import { StatCard } from '../../components/dashboard/StatCard'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { errorMessage } from '../../lib/errors'
import { dashboardService } from './dashboardService'
import type { DashboardSummary } from './dashboardTypes'

export function DashboardPage() {
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
      <header className="page-header">
        <div><p className="eyebrow">Visao geral</p><h1>Dashboard</h1><p>Acompanhe operacao, aprovacao e governanca da plataforma.</p></div>
      </header>
      <div className="stats-grid">
        <StatCard label="Usuarios" value={data.totalUsuarios} detail={`${data.usuariosAtivos} ativos`} />
        <StatCard label="Projetos" value={data.totalProjetos} detail={`${data.projetosAbertos} abertos`} />
        <StatCard label="Inscricoes pendentes" value={data.inscricoesPendentes} />
        <StatCard label="Documentos em analise" value={data.documentosEmAnalise} />
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
