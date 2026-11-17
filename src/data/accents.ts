/** Акцентные палитры. Значения подставляются в CSS-переменные на <html>. */
export interface AccentPalette {
  id: string
  title: string
  /** Основной акцентный цвет */
  accent: string
  /** Полупрозрачная подложка (бейджи, активные сегменты) */
  soft: string
  /** Цвет текста/иконки поверх акцента */
  foreground: string
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'berry',
    title: 'Ягодно-пудровый',
    accent: '#C85A72',
    soft: 'rgba(200, 90, 114, 0.14)',
    foreground: '#FFFFFF',
  },
  {
    id: 'caramel',
    title: 'Карамельный',
    accent: '#C67D3B',
    soft: 'rgba(198, 125, 59, 0.16)',
    foreground: '#FFFFFF',
  },
  {
    id: 'pistachio',
    title: 'Фисташковый',
    accent: '#4E8B63',
    soft: 'rgba(78, 139, 99, 0.16)',
    foreground: '#FFFFFF',
  },
  {
    id: 'blueberry',
    title: 'Черничный',
    accent: '#6B5B95',
    soft: 'rgba(107, 91, 149, 0.16)',
    foreground: '#FFFFFF',
  },
  {
    id: 'chocolate',
    title: 'Шоколадный',
    accent: '#7A4B3A',
    soft: 'rgba(122, 75, 58, 0.18)',
    foreground: '#FFFFFF',
  },
  {
    id: 'peach',
    title: 'Персиковый',
    accent: '#D9725B',
    soft: 'rgba(217, 114, 91, 0.16)',
    foreground: '#FFFFFF',
  },
  {
    id: 'mint',
    title: 'Мятный',
    accent: '#3F8C82',
    soft: 'rgba(63, 140, 130, 0.16)',
    foreground: '#FFFFFF',
  },
  {
    id: 'lavender',
    title: 'Лавандовый',
    accent: '#8A6A9B',
    soft: 'rgba(138, 106, 155, 0.16)',
    foreground: '#FFFFFF',
  },
]

export const DEFAULT_ACCENT_ID = 'berry'

export function findAccent(id: string | undefined): AccentPalette {
  return ACCENT_PALETTES.find((item) => item.id === id) ?? ACCENT_PALETTES[0]
}
