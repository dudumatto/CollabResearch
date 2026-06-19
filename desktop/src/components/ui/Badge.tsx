import type { PropsWithChildren } from 'react'

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
