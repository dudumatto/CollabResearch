export function LoadingState({ label = 'Carregando dados...' }: { label?: string }) {
  return <div className="state loading" role="status"><span className="spinner" />{label}</div>
}
