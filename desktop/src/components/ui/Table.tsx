import type { PropsWithChildren } from 'react'

export function Table({ children }: PropsWithChildren) {
  return <div className="table-scroll"><table className="table">{children}</table></div>
}
