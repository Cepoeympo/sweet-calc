import { useMemo, useState } from 'react'
import { ArrowLeft, ChefHat, Copy, Pencil, Trash2 } from 'lucide-react'
import { NutritionGrid, NutritionInline } from '@/components/NutritionBlocks'
import { RecipeImage } from '@/components/RecipeImage'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { NumberField } from '@/components/ui/NumberField'
import { Segmented } from '@/components/ui/Segmented'
import { calculateRecipeCost } from '@/lib/calc'
import { formatMoney, formatNumber, formatWeight, parseDecimal, toInputValue } from '@/lib/format'
import { calculateNutritionPer100g } from '@/lib/nutrition'
import { scaleRecipe, type ScaleMode } from '@/lib/scale'
import { useApp } from '@/store/useApp'
import type { Recipe } from '@/types'

export function RecipeView({
  recipe,
  onBack,
  onEdit,
}: {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
}) {
  const { stockMap, deleteRecipe, duplicateRecipeById, notify } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mode, setMode] = useState<ScaleMode>(recipe.finalPieces ? 'pieces' : 'weight')
  const [target, setTarget] = useState(
    toInputValue(recipe.finalPieces ?? recipe.finalWeight ?? 0),
  )

  const cost = useMemo(() => calculateRecipeCost(recipe, stockMap), [recipe, stockMap])
  const nutrition = useMemo(() => calculateNutritionPer100g(recipe, stockMap), [recipe, stockMap])
  const batch = useMemo(
    () => scaleRecipe(recipe, stockMap, mode, parseDecimal(target)),
    [recipe, stockMap, mode, target],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад к продукции"
          className="tap-none flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-field bg-surface-2">
          <RecipeImage image={recipe.image} alt={recipe.name} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight text-ink">{recipe.name}</h1>
          <p className="mt-0.5 text-[11px] text-muted">
            {formatWeight(recipe.finalWeight)}
            {recipe.finalPieces ? ` · ${formatNumber(recipe.finalPieces, 0)} шт` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Редактировать"
          className="tap-none flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink"
        >
          <Pencil size={17} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-card border border-line bg-surface px-3 py-2.5 text-center">
          <p className="text-[11px] text-muted">За 100 г</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{formatMoney(cost.costPerGram * 100)}</p>
        </div>
        <div className="rounded-card border border-line bg-surface px-3 py-2.5 text-center">
          <p className="text-[11px] text-muted">За 1 шт</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {cost.costPerPiece !== null ? formatMoney(cost.costPerPiece) : '—'}
          </p>
        </div>
        <div className="rounded-card border border-line bg-surface px-3 py-2.5 text-center">
          <p className="text-[11px] text-muted">Партия</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{formatWeight(recipe.finalWeight)}</p>
        </div>
      </div>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">КБЖУ на 100 г</h2>
          <span className="text-xs text-muted">
            {recipe.finalPieces ? `${formatNumber(recipe.finalPieces, 0)} шт в партии` : 'по весу'}
          </span>
        </div>
        <NutritionGrid totals={nutrition} caption="С учётом фактического веса партии (уварка, усушка)" />
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-ink">Состав партии</h2>
        <ul className="flex flex-col divide-y divide-line">
          {cost.lines.map((line) => (
            <li key={line.stockItemId} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-sm text-ink">{line.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {formatNumber(line.amount, 1)} {line.unitLabel}
                <span className="ml-2 text-ink">{formatMoney(line.cost)}</span>
              </span>
            </li>
          ))}
        </ul>
        {cost.missingIds.length > 0 ? (
          <p className="mt-2 text-xs text-danger">
            Часть ингредиентов удалена со склада — себестоимость занижена.
          </p>
        ) : null}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
          <span className="text-xs text-muted">Себестоимость партии</span>
          <span className="text-base font-semibold text-ink">{formatMoney(cost.batchCost)}</span>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <ChefHat size={18} className="text-accent" />
          <h2 className="text-sm font-semibold text-ink">Режим «Замес»</h2>
        </div>

        <div className="flex flex-col gap-3">
          {recipe.finalPieces ? (
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pieces', label: 'На штуки' },
                { value: 'weight', label: 'На вес' },
              ]}
            />
          ) : null}

          <NumberField
            value={target}
            onChange={setTarget}
            suffix={mode === 'pieces' ? 'шт' : 'г'}
            aria-label="Объём замеса"
          />

          <p className="text-xs text-muted">
            Коэффициент пересчёта: ×{formatNumber(batch.factor, 2)} · выход{' '}
            {formatWeight(batch.targetWeight)}
            {batch.targetPieces ? ` · ${formatNumber(batch.targetPieces, 1)} шт` : ''}
          </p>

          <ul className="flex flex-col divide-y divide-line">
            {batch.items.map((item) => (
              <li
                key={item.stockItemId}
                className="flex items-baseline justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-ink">{item.name}</span>
                <span className="shrink-0 font-semibold text-accent">
                  {formatNumber(item.amount, 1)} {item.unitLabel}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              setTarget(toInputValue(recipe.finalPieces ?? recipe.finalWeight ?? 0))
            }
            className="tap-none self-start text-xs font-medium text-muted underline"
          >
            Вернуть исходную партию
          </button>
        </div>
      </section>

      {recipe.notes ? (
        <section className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-1.5 text-sm font-semibold text-ink">Заметки к техкарте</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{recipe.notes}</p>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 pb-2">
        <Button
          variant="secondary"
          onClick={() => {
            void duplicateRecipeById(recipe.id).then((copy) => {
              if (copy) onBack()
            })
          }}
        >
          <Copy size={17} /> Дублировать рецепт
        </Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={17} /> Удалить рецепт
        </Button>
        <NutritionInline totals={nutrition} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Удалить рецепт?"
        description={`Техкарта «${recipe.name}» будет удалена без возможности восстановления. Позиции склада останутся на месте.`}
        confirmLabel="Удалить"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          void deleteRecipe(recipe.id).then(() => {
            notify('Рецепт удалён', 'success')
            onBack()
          })
        }}
      />
    </div>
  )
}
