import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastTone = 'info' | 'success' | 'error'

export interface ToastMessage {
  id: string
  message: string
  tone: ToastTone
}

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
} as const

const TONES: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  error: 'text-danger',
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px_+_env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone]
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-app animate-slide-up items-start gap-2.5 rounded-card border border-line bg-surface px-3.5 py-3 shadow-float"
          >
            <Icon size={20} className={cn('mt-0.5 shrink-0', TONES[toast.tone])} />
            <p className="flex-1 text-sm leading-snug text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Скрыть уведомление"
              className="tap-none -mr-1 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
