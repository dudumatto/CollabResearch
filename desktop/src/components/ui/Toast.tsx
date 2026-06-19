import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'

type ToastItem = { id: number; message: string; tone: 'success' | 'error' }
type Context = { notify: (message: string, tone?: ToastItem['tone']) => void }
const ToastContext = createContext<Context | null>(null)

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([])
  const notify = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now()
    setItems((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600)
  }, [])
  const value = useMemo(() => ({ notify }), [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <aside className="toasts" aria-live="polite">
        {items.map((item) => <div key={item.id} className={`toast toast-${item.tone}`}>{item.message}</div>)}
      </aside>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('ToastProvider ausente')
  return context
}
