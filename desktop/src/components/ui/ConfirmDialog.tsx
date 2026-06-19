import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog({ title, message, onConfirm, onClose, busy }: { title: string; message: string; onConfirm: () => void; onClose: () => void; busy?: boolean }) {
  return (
    <Modal title={title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={onConfirm}>Confirmar</Button></>}>
      <p>{message}</p>
    </Modal>
  )
}
