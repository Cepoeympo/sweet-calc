import { useMemo, useState } from 'react'
import { ChevronDown, Copy, Minus, Plus, ShoppingBag } from 'lucide-react'
import { NutritionGrid, NutritionInline } from '@/components/NutritionBlocks'
import { RecipeImage } from '@/components/RecipeImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { NumberField } from '@/components/ui/NumberField'
import { Segmented } from '@/components/ui/Segmented'
import { Slider } from '@/components/ui/Slider'
import { RecipeSelectModal } from '@/features/calculator/RecipeSelectModal'
import { calculateOrder, unitPrice, type OrderMode } from '@/lib/calc'
import { buildClientText } from '@/lib/clientText'
import { copyText } from '@/lib/clipboard'
import { ROUNDING_OPTIONS } from '@/data/defaults'
import { formatMoney, formatNumber, formatWeight, parseDecimal, toInputValue } from '@/lib/format'
import {
  calculateNutritionPer100g,
  nutritionForPiece,
  nutritionForWeight,
} from '@/lib/nutrition'
import { useApp } from '@/store/useApp'
import type { OrderExtra, Recipe } from '@/types'

const PIECES_PRESETS = [6, 9, 12, 16]
const WEIGHT_PRESETS = [250, 500, 1000]
const MARKUP_PRESETS = [100, 150, 200, 250]

export function CalculatorTab() {
  const { recipes, stock, stockMap, settings, notify } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<OrderMode>('pieces')
  const [quantity, setQuantity] = useState('9')
  const [extras, setExtras] = useState<OrderExtra[]>([])
  const [markupText, setMarkupText] = useState(toInputValue(settings.markupPercent))
  const [selectorOpen, setSelectorOpen] = useState(false)

  const recipe = useMemo<Recipe | null>(() => {
    if (recipes.length === 0) return null
    return recipes.find((entry) => entry.id === selectedId) ?? recipes[0]
  }, [recipes, selectedId])

  const effectiveMode: OrderMode = recipe?.finalPieces ? mode : 'weight'
  const quantityValue = parseDecimal(quantity)

  const result = useMemo(() => {
    if (!recipe) return null
    return calculateOrder({
      recipe,
      stock: stockMap,
      mode: effectiveMode,
      quantity: quantityValue,
      extras,
      markupPercent: parseDecimal(markupText),
      roundingStep: settings.roundingStep,
    })
  }, [recipe, stockMap, effectiveMode, quantityValue, extras, markupText, settings.roundingStep])

  const per100g = useMemo(
    () => (recipe ? calculateNutritionPer100g(recipe, stockMap) : null),
    [recipe, stockMap],
  )
  const orderNutrition = useMemo(
    () => (result ? nutritionForWeight(per100g, result.productWeight) : null),
    [per100g, result],
  )
  const pieceNutrition = useMemo(
    () => (recipe ? nutritionForPiece(per100g, recipe) : null),
    [per100g, recipe],
  )

  const packagingItems = useMemo(
    () => stock.filter((item) => item.type === 'unit' || item.type === 'overhead'),
    [stock],
  )

  const extrasTotal = useMemo(
    () => (result ? result.extrasCost : 0),
    [result],
  )

  if (!recipe || !result) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-semibold text-ink">Калькулятор</h1>
          <p className="mt-0.5 text-xs text-muted">Расчёт заказа для клиента</p>
        </header>
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Сначала создайте техкарту"
          description="Перейдите на вкладку «Продукция» и добавьте рецепт с составом и выходом партии."
        />
      </div>
    )
  }

  const changeQuantity = (value: number) => setQuantity(String(value))

  const extraQuantity = (stockItemId: string): number =>
    extras.find((extra) => extra.stockItemId === stockItemId)?.quantity ?? 0

  const increment = (stockItemId: string) => {
    setExtras((prev) => {
      const found = prev.find((extra) => extra.stockItemId === stockItemId)
      if (!found) return [...prev, { stockItemId, quantity: 1 }]
      return prev.map((extra) =>
        extra.stockItemId === stockItemId
          ? { ...extra, quantity: extra.quantity + 1 }
          : extra,
      )
    })
  }

  const decrement = (stockItemId: string) => {
    setExtras((prev) =>
      prev.flatMap((extra) => {
        if (extra.stockItemId !== stockItemId) return [extra]
        if (extra.quantity > 1) return [{ ...extra, quantity: extra.quantity - 1 }]
        return []
      }),
    )
  }

  const selectRecipe = (next: Recipe) => {
    setSelectedId(next.id)
    setExtras([])
    setMode(next.finalPieces ? 'pieces' : 'weight')
    setQuantity(next.finalPieces ? String(Math.min(next.finalPieces, 9)) : '500')
  }

  const roundingLabel =
    ROUNDING_OPTIONS.find((option) => option.value === settings.roundingStep)?.label ??
    'Без округления'

  const handleCopy = async () => {
    const text = buildClientText({
      recipe,
      stock: stockMap,
      result,
      mode: effectiveMode,
      quantity: quantityValue,
    })
    const ok = await copyText(text)
    notify(
      ok ? 'Текст для клиента скопирован' : 'Не удалось скопировать текст',
      ok ? 'success' : 'error',
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-ink">Калькулятор</h1>
        <p className="mt-0.5 text-xs text-muted">Расчёт заказа для клиента</p>
      </header>

      {/* Продукция */}
      <section className="rounded-card border border-line bg-surface p-3 shadow-card">
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="tap-none flex w-full items-center gap-3 text-left"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-field bg-surface-2">
            <RecipeImage image={recipe.image} alt={recipe.name} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted">Продукция</p>
            <p className="truncate text-[15px] font-medium text-ink">{recipe.name}</p>
            <p className="text-xs text-muted">
              {formatWeight(recipe.finalWeight)} в партии
              {recipe.finalPieces ? ` · ${formatNumber(recipe.finalPieces, 0)} шт` : ''}
            </p>
          </div>
          <ChevronDown size={18} className="shrink-0 text-muted" />
        </button>
      </section>

      {/* Объём заказа */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-ink">Объём заказа</h2>
        {recipe.finalPieces ? (
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'pieces', label: 'По штукам' },
              { value: 'weight', label: 'По весу (г)' },
            ]}
            className="mb-3"
          />
        ) : null}

        <NumberField
          value={quantity}
          onChange={setQuantity}
          suffix={effectiveMode === 'pieces' ? 'шт' : 'г'}
          placeholder="0"
        />

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {(effectiveMode === 'pieces' ? PIECES_PRESETS : WEIGHT_PRESETS).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => changeQuantity(preset)}
              className={`tap-none shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                quantityValue === preset
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {preset} {effectiveMode === 'pieces' ? 'шт' : 'г'}
            </button>
          ))}
        </div>

        {result.warnings.map((warning) => (
          <p key={warning} className="mt-2 text-xs text-danger">
            {warning}
          </p>
        ))}
      </section>

      {/* Комплектация */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Упаковка и доп. расходы</h2>
          <span className="text-xs text-muted">{formatMoney(extrasTotal)}</span>
        </div>

        {packagingItems.length === 0 ? (
          <p className="rounded-field border border-dashed border-line px-3 py-3 text-xs text-muted">
            Упаковки пока нет. Добавьте позиции типа «Упаковка» или «Накладные» на складе.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {packagingItems.map((item) => {
              const qty = extraQuantity(item.id)
              return (
                <li key={item.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{item.name}</p>
                    <p className="text-[11px] text-muted">
                      {item.type === 'overhead'
                        ? item.overheadMode === 'percent'
                          ? `${item.packPrice}% от себестоимости продукции`
                          : `${formatMoney(item.packPrice)} / заказ`
                        : `${formatMoney(unitPrice(item))} / шт`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decrement(item.id)}
                      disabled={qty === 0}
                      aria-label={`Убрать ${item.name}`}
                      className="tap-none flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink disabled:opacity-40"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-ink">{qty}</span>
                    <button
                      type="button"
                      onClick={() => increment(item.id)}
                      aria-label={`Добавить ${item.name}`}
                      className="tap-none flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-fg"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Наценка */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Наценка</h2>
          <span className="text-xs text-muted">{roundingLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Slider
              min={0}
              max={500}
              step={5}
              value={Math.min(parseDecimal(markupText), 500)}
              onChange={(value) => setMarkupText(String(value))}
            />
          </div>
          <div className="w-24">
            <NumberField
              value={markupText}
              onChange={setMarkupText}
              suffix="%"
              aria-label="Наценка в процентах"
            />
          </div>
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {MARKUP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMarkupText(String(preset))}
              className={`tap-none shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                parseDecimal(markupText) === preset
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </section>

      {/* Итог */}
      <section className="rounded-card border border-accent/40 bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">Итог заказа</h2>

        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted">Себестоимость продукции</dt>
            <dd className="font-medium text-ink">{formatMoney(result.productCost)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted">Упаковка и доп. расходы</dt>
            <dd className="font-medium text-ink">{formatMoney(result.extrasCost)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-line pt-1.5">
            <dt className="font-medium text-ink">Общая себестоимость</dt>
            <dd className="font-semibold text-ink">{formatMoney(result.totalCost)}</dd>
          </div>
        </dl>

        <div className="mt-3 rounded-field bg-accent-soft px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Рекомендуемая цена для клиента</p>
          <p className="mt-0.5 text-2xl font-bold text-ink">{formatMoney(result.finalPrice)}</p>
          <p className="mt-0.5 text-xs text-muted">
            Чистая прибыль: <span className="font-semibold text-ink">{formatMoney(result.profit)}</span>
            {' · '}
            {formatNumber(result.marginPercent, 0)}% от цены
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1 text-xs text-muted">
          <span>
            В заказе: {formatWeight(result.productWeight)}
            {result.productPieces ? ` · ${formatNumber(result.productPieces, 0)} шт` : ''}
          </span>
          <NutritionInline totals={per100g} />
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <NutritionGrid totals={per100g} caption="КБЖУ на 100 г" />
          {orderNutrition ? (
            <NutritionGrid totals={orderNutrition} caption="КБЖУ на весь заказ" />
          ) : null}
          {effectiveMode === 'weight' && pieceNutrition ? (
            <NutritionGrid totals={pieceNutrition} caption="КБЖУ на 1 шт" />
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="tap-none mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-field bg-accent text-[15px] font-semibold text-accent-fg"
        >
          <Copy size={17} /> Скопировать для клиента
        </button>
      </section>

      <RecipeSelectModal
        open={selectorOpen}
        recipes={recipes}
        stockMap={stockMap}
        selectedId={recipe.id}
        onSelect={selectRecipe}
        onClose={() => setSelectorOpen(false)}
      />
    </div>
  )
}
