import { DEFAULT_ACCENT_ID } from '@/data/accents'
import type { Settings } from '@/types'

export const APP_NAME = 'Sweet Calc'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accentId: DEFAULT_ACCENT_ID,
  markupPercent: 150,
  roundingStep: 0,
  gistToken: '',
  gistId: '',
  lastSyncAt: null,
}

/** Шаги округления для селектора в настройках */
export const ROUNDING_OPTIONS: { value: 0 | 10 | 50 | 100; label: string }[] = [
  { value: 0, label: 'Без округления' },
  { value: 10, label: 'До 10 ₽' },
  { value: 50, label: 'До 50 ₽' },
  { value: 100, label: 'До 100 ₽' },
]

