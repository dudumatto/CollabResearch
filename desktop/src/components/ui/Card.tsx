import type { PropsWithChildren, ReactNode } from 'react'

export function Card({ title, action, children, className = '' }: PropsWithChildren<{ title?: string; action?: ReactNode; className?: string }>) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && <header className="card-header"><h2>{title}</h2>{action}</header>}
      {children}
    </section>
  )
}
