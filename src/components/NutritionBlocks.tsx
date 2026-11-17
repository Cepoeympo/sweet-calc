import { formatNumber } from '@/lib/format'
import type { NutritionTotals } from '@/lib/nutrition'

const CELLS: { key: keyof NutritionTotals; label: string; unit: string; digits: number }[] = [
  { key: 'proteins', label: 'Белки', unit: 'г', digits: 1 },
  { key: 'fats', label: 'Жиры', unit: 'г', digits: 1 },
  { key: 'carbs', label: 'Углеводы', unit: 'г', digits: 1 },
  { key: 'kcal', label: 'Калории', unit: 'ккал', digits: 0 },
]

/** Компактная строка КБЖУ для карточек. */
export function NutritionInline({ totals }: { totals: NutritionTotals | null }) {
  if (!totals) return <span className="text-xs text-muted">КБЖУ не заполнено</span>
  return (
    <span className="text-xs text-muted">
      Б {formatNumber(totals.proteins, 1)} · Ж {formatNumber(totals.fats, 1)} · У{' '}
      {formatNumber(totals.carbs, 1)} · {formatNumber(totals.kcal, 0)} ккал
    </span>
  )
}

/** Сетка из четырёх показателей КБЖУ. */
export function NutritionGrid({
  totals,
  caption,
}: {
  totals: NutritionTotals | null
  caption?: string
}) {
  if (!totals) {
    return (
      <p className="rounded-field bg-surface-2 px-3 py-2 text-xs text-muted">
        КБЖУ не рассчитано: заполните пищевую ценность ингредиентов на складе.
      </p>
    )
  }

  return (
    <div>
      {caption ? <p className="mb-1.5 text-xs text-muted">{caption}</p> : null}
      <div className="grid grid-cols-4 gap-2">
        {CELLS.map((cell) => (
          <div key={cell.key} className="rounded-field bg-surface-2 px-2 py-2 text-center">
            <p className="text-[11px] leading-none text-muted">{cell.label}</p>
            <p className="mt-1 text-sm font-semibold leading-none text-ink">
              {formatNumber(totals[cell.key], cell.digits)}
            </p>
            <p className="mt-0.5 text-[10px] leading-none text-muted">{cell.unit}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
