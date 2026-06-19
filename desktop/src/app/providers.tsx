import type { PropsWithChildren } from 'react'
import { ToastProvider } from '../components/ui/Toast'

export function Providers({ children }: PropsWithChildren) {
  return <ToastProvider>{children}</ToastProvider>
}
