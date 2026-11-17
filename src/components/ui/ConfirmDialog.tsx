import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </Modal>
  )
}
