import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const accents = {
  blue: { bar: '#2563eb', bg: '#eef2ff', icon: '#3b82f6', trendUp: '#16a34a', trendDown: '#dc2626' },
  green: { bar: '#16a34a', bg: '#f0fdf4', icon: '#22c55e', trendUp: '#16a34a', trendDown: '#dc2626' },
  amber: { bar: '#d97706', bg: '#fffbeb', icon: '#f59e0b', trendUp: '#16a34a', trendDown: '#dc2626' },
  purple: { bar: '#9333ea', bg: '#faf5ff', icon: '#a855f7', trendUp: '#16a34a', trendDown: '#dc2626' },
}

interface StatCardProps {
  label: string
  value: number
  detail?: string
  icon: LucideIcon
  accent?: keyof typeof accents
  trend?: number
}

export function StatCard({ label, value, detail, icon: Icon, accent = 'blue', trend }: StatCardProps) {
  const colors = accents[accent]
  const trendUp = trend !== undefined && trend >= 0

  return (
    <div className="stat-card" style={{ '--accent-bar': colors.bar, '--accent-bg': colors.bg } as React.CSSProperties}>
      <div className="stat-card-head">
        <div className="stat-card-icon" style={{ background: colors.bg, color: colors.icon }}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        {trend !== undefined && (
          <span className="stat-card-trend" style={{ color: trendUp ? colors.trendUp : colors.trendDown }}>
            {trendUp ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <strong className="stat-card-value">{value.toLocaleString('pt-BR')}</strong>
      <div className="stat-card-footer">
        <span className="stat-card-label">{label}</span>
        {detail && <span className="stat-card-detail">{detail}</span>}
      </div>
    </div>
  )
}
