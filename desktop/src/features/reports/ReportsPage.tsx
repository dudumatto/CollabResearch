import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { exportCsv } from '../../lib/csv'
import { formatDateTime } from '../../lib/date'
import { errorMessage } from '../../lib/errors'
import { formatReportLabel, sumReportValues } from '../../lib/reportFormatters'
import { reportsService } from './reportsService'
import type { ReportSummary } from './reportsTypes'

export function ReportsPage() {
  const [data, setData] = useState<ReportSummary | null>(null)
  const [error, setError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const load = async () => {
    try { setError(''); setData(await reportsService.summary()) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [])
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!data) return <LoadingState label="Gerando relatorio..." />
  const datasets = [
    { title: 'Usuarios por perfil', values: data.usuariosPorTipo },
    { title: 'Projetos por status', values: data.projetosPorStatus },
    { title: 'Inscricoes por status', values: data.inscricoesPorStatus },
    { title: 'Documentos por status', values: data.documentosPorStatus },
  ]
  const total = datasets.reduce((sum, dataset) => sum + sumReportValues(dataset.values), 0)
  const downloadCsv = () => exportCsv('relatorio-collabresearch.csv', datasets.flatMap((set) => Object.entries(set.values).map(([categoria, quantidade]) => ({ grupo: set.title, categoria: formatReportLabel(categoria), quantidade }))))
  const exportPdf = async () => {
    if (!window.desktop?.exportPdf) {
      window.print()
      return
    }

    setExportingPdf(true)
    try {
      await window.desktop.exportPdf('relatorio-collabresearch.pdf')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="page report-page">
      <header className="page-header report-screen-header">
        <div><p className="eyebrow">Governanca</p><h1>Relatorios</h1><p>Gerado em {formatDateTime(data.geradoEm)}</p></div>
        <div className="report-actions">
          <Button variant="secondary" onClick={downloadCsv}>Exportar CSV</Button>
          <Button onClick={() => void exportPdf()} disabled={exportingPdf}>{exportingPdf ? 'Exportando...' : 'Exportar PDF'}</Button>
        </div>
      </header>

      <section className="report-document" aria-label="Relatorio CollabResearch">
        <div className="report-cover">
          <div>
            <p className="eyebrow">CollabResearch</p>
            <h2>Relatorio administrativo</h2>
            <p>Resumo consolidado de usuarios, projetos, inscricoes e documentos.</p>
          </div>
          <dl>
            <div><dt>Gerado em</dt><dd>{formatDateTime(data.geradoEm)}</dd></div>
            <div><dt>Total consolidado</dt><dd>{total}</dd></div>
          </dl>
        </div>

        <div className="report-summary-grid">
          {datasets.map((dataset) => (
            <Card key={dataset.title}>
              <p>{dataset.title}</p>
              <strong>{sumReportValues(dataset.values)}</strong>
            </Card>
          ))}
        </div>

        <div className="report-grid">
          {datasets.map((dataset) => (
            <Card key={dataset.title} title={dataset.title}>
              <dl className="report-values">
                {Object.entries(dataset.values).map(([label, value]) => (
                  <div key={label}>
                    <dt>{formatReportLabel(label)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
