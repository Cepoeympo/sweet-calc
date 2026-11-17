import { findAccent } from '@/data/accents'
import type { ThemeMode } from '@/types'

export const THEME_COLOR_LIGHT = '#FAF8F5'
export const THEME_COLOR_DARK = '#181617'

const darkQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/** Итоговая тема с учётом системных настроек. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return darkQuery()?.matches ? 'dark' : 'light'
  }
  return mode
}

/** Применяет тему, акцентные переменные и обновляет meta theme-color. */
export function applyTheme(mode: ThemeMode, accentId: string): void {
  if (typeof document === 'undefined') return

  const resolved = resolveTheme(mode)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = resolved
  root.style.colorScheme = resolved

  const accent = findAccent(accentId)
  root.style.setProperty('--accent', accent.accent)
  root.style.setProperty('--accent-soft', accent.soft)
  root.style.setProperty('--accent-foreground', accent.foreground)

  const meta = document.getElementById('theme-color')
  if (meta instanceof HTMLMetaElement) {
    meta.content = resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
  }
}

/** Подписка на изменение системной темы. Возвращает функцию отписки. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = darkQuery()
  if (!query) return () => undefined
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
