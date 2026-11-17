/** Форматирование чисел и сумм в русской локали. */

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

const moneyFormatterPrecise = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const decimalFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
})

/** Округление до заданного количества знаков без накопления ошибок float. */
export function roundTo(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** «1 235 ₽» — по умолчанию без копеек. */
export function formatMoney(value: number, options?: { precise?: boolean }): string {
  if (!Number.isFinite(value)) return '0 ₽'
  const formatted = options?.precise ? moneyFormatterPrecise.format(value) : moneyFormatter.format(value)
  return `${formatted} ₽`
}

/** «1,25» — число с русской запятой и обрезкой лишних нулей. */
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)
}

/** «250 г» или «1,25 кг» — удобное отображение веса. */
export function formatWeight(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return '0 г'
  if (grams >= 1000) return `${formatNumber(grams / 1000, 2)} кг`
  return `${formatNumber(grams, grams % 1 === 0 ? 0 : 1)} г`
}

/** «150%» */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${decimalFormatter.format(value)}%`
}

/** Парсинг пользовательского ввода: запятая и точка одинаково допустимы. */
export function parseDecimal(input: string): number {
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}

/** Отображение значения в числовом поле: пустая строка вместо NaN. */
export function toInputValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

/** «17.11.2026» — метка «обновлено 17.11.2026» на карточках склада. */
export function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

/** «17.11.2026, 14:05» — индикатор последней синхронизации. */
export function formatDateTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(timestamp)}, ${hours}:${minutes}`
}
