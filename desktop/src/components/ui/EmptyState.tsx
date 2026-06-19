export function EmptyState({ message = 'Nenhum registro encontrado.' }: { message?: string }) {
  return <div className="state empty">{message}</div>
}
