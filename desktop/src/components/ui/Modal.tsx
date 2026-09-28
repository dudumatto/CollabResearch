import { useEffect, type PropsWithChildren, type ReactNode } from 'react'
import { Button } from './Button'

export function Modal({ title, children, footer, onClose, closeDisabled = false }: PropsWithChildren<{ title: string; footer?: ReactNode; onClose: () => void; closeDisabled?: boolean }>) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, closeDisabled])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={closeDisabled ? undefined : onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header"><h2>{title}</h2><Button variant="ghost" aria-label="Fechar" onClick={onClose} disabled={closeDisabled}>X</Button></header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  )
}
