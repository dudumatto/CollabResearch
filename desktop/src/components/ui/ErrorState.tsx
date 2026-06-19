import { Button } from './Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state error"><p>{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}</div>
}
