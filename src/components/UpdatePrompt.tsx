import { useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Тост о новой версии приложения. Service Worker регистрируется в режиме 'prompt',
 * поэтому обновление применяется только по кнопке «Обновить».
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Проверяем обновления раз в час, пока приложение открыто
      window.setInterval(() => {
        void registration.update()
      }, 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.warn('Sweet Calc: не удалось зарегистрировать Service Worker', error)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    const timer = window.setTimeout(() => setNeedRefresh(false), 30000)
    return () => window.clearTimeout(timer)
  }, [needRefresh, setNeedRefresh])

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px_+_env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-app animate-slide-up items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3 shadow-float">
        <RefreshCw size={20} className="shrink-0 text-accent" />
        <p className="flex-1 text-sm leading-snug text-ink">
          Доступна новая версия приложения — обновите, чтобы получить изменения.
        </p>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="tap-none h-9 shrink-0 rounded-full bg-accent px-3.5 text-sm font-semibold text-accent-fg"
        >
          Обновить
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Отложить обновление"
          className="tap-none flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
