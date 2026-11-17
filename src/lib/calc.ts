import type { OrderExtra, Recipe, StockItem } from '@/types'

/** Способы передачи склада в расчёты: Map, объект по id или геттер. */
export type StockSource = Map<string, StockItem> | Record<string, StockItem>

export function buildStockMap(items: StockItem[]): Map<string, StockItem> {
  return new Map(items.map((item) => [item.id, item]))
}

export function lookupStock(stock: StockSource, id: string): StockItem | undefined {
  if (stock instanceof Map) return stock.get(id)
  return Object.prototype.hasOwnProperty.call(stock, id) ? stock[id] : undefined
}

/** Подпись единицы измерения позиции склада. */
export function stockUnitLabel(item: StockItem | undefined): string {
  if (!item) return ''
  if (item.type === 'food') return 'г'
  if (item.type === 'unit') return 'шт'
  return item.overheadMode === 'percent' ? '%' : '₽'
}

/**
 * Цена единицы:
 * - food — ₽ за 1 г (packPrice / packAmount)
 * - unit — ₽ за 1 шт (packPrice / packAmount)
 * - overhead — сама сумма (или процент), packAmount не участвует
 */
export function unitPrice(item: StockItem | undefined): number {
  if (!item) return 0
  if (item.type === 'overhead') return item.packPrice > 0 ? item.packPrice : 0
  if (!Number.isFinite(item.packAmount) || item.packAmount <= 0) return 0
  if (!Number.isFinite(item.packPrice) || item.packPrice < 0) return 0
  return item.packPrice / item.packAmount
}

/** Цена за 100 г — для карточек склада и продукции. */
export function unitPricePer100(item: StockItem | undefined): number {
  if (!item) return 0
  if (item.type === 'food') return unitPrice(item) * 100
  return unitPrice(item)
}

export interface RecipeCostLine {
  stockItemId: string
  name: string
  amount: number
  unitLabel: string
  unitPrice: number
  cost: number
}

export interface RecipeCost {
  lines: RecipeCostLine[]
  batchCost: number
  /** Себестоимость 1 г готового продукта */
  costPerGram: number
  /** Себестоимость 1 шт; null, если штуки не заданы */
  costPerPiece: number | null
  /** Позиции склада, которых больше нет (удалены) */
  missingIds: string[]
}

/** Себестоимость партии по техкарте (без упаковки и накладных). */
export function calculateRecipeCost(recipe: Recipe, stock: StockSource): RecipeCost {
  const lines: RecipeCostLine[] = []
  const missingIds: string[] = []
  let batchCost = 0

  for (const ingredient of recipe.items) {
    const item = lookupStock(stock, ingredient.stockItemId)
    const amount = Number.isFinite(ingredient.amount) ? ingredient.amount : 0

    if (!item) {
      missingIds.push(ingredient.stockItemId)
      continue
    }

    const price = unitPrice(item)
    const cost = price * amount
    batchCost += cost
    lines.push({
      stockItemId: item.id,
      name: item.name,
      amount,
      unitLabel: stockUnitLabel(item),
      unitPrice: price,
      cost,
    })
  }

  const finalWeight = recipe.finalWeight > 0 ? recipe.finalWeight : 0
  const finalPieces = recipe.finalPieces && recipe.finalPieces > 0 ? recipe.finalPieces : 0

  return {
    lines,
    batchCost,
    costPerGram: finalWeight > 0 ? batchCost / finalWeight : 0,
    costPerPiece: finalPieces > 0 ? batchCost / finalPieces : null,
    missingIds,
  }
}

/** Округление цены вверх до шага (10/50/100 ₽). Шаг 0 — без округления. */
export function roundPriceUp(value: number, step: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (!step || step <= 0) return Math.round(value * 100) / 100
  return Math.ceil(value / step) * step
}

export type OrderMode = 'pieces' | 'weight'

export interface OrderInput {
  recipe: Recipe
  stock: StockSource
  mode: OrderMode
  /** Количество: штуки или граммы */
  quantity: number
  extras: OrderExtra[]
  markupPercent: number
  roundingStep: number
}

export interface OrderExtraLine {
  stockItemId: string
  name: string
  quantity: number
  unitLabel: string
  unitPrice: number
  cost: number
}

export interface OrderResult {
  /** Доля партии, которая уходит в заказ (0…1) */
  share: number
  productWeight: number
  productPieces: number | null
  productCost: number
  extrasCost: number
  totalCost: number
  priceBeforeRounding: number
  finalPrice: number
  profit: number
  /** Прибыль к цене, % */
  marginPercent: number
  extraLines: OrderExtraLine[]
  missingIds: string[]
  warnings: string[]
}

/**
 * Доля партии для заказа.
 * По штукам — quantity / finalPieces, по весу — quantity / finalWeight.
 */
export function orderShare(recipe: Recipe, mode: OrderMode, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0
  if (mode === 'pieces') {
    const pieces = recipe.finalPieces ?? 0
    return pieces > 0 ? quantity / pieces : 0
  }
  return recipe.finalWeight > 0 ? quantity / recipe.finalWeight : 0
}

/** Полный расчёт заказа: продукция + упаковка/накладные + наценка и округление. */
export function calculateOrder(input: OrderInput): OrderResult {
  const { recipe, stock, mode, quantity, extras, markupPercent, roundingStep } = input
  const warnings: string[] = []

  const cost = calculateRecipeCost(recipe, stock)
  const share = orderShare(recipe, mode, quantity)

  if (share === 0) {
    warnings.push(
      mode === 'pieces'
        ? 'В рецепте не указано количество штук на выходе — переключитесь на расчёт по весу.'
        : 'Укажите вес готовой партии в рецепте, чтобы считать по весу.',
    )
  }

  const productCost = cost.batchCost * share
  const productWeight = recipe.finalWeight > 0 ? recipe.finalWeight * share : 0
  const productPieces = recipe.finalPieces && recipe.finalPieces > 0 ? recipe.finalPieces * share : null

  const extraLines: OrderExtraLine[] = []
  const missingIds: string[] = []
  let extrasCost = 0

  for (const extra of extras) {
    const item = lookupStock(stock, extra.stockItemId)
    if (!item) {
      missingIds.push(extra.stockItemId)
      continue
    }
    if (item.type === 'overhead' && item.overheadMode === 'percent') {
      const lineCost = (productCost * item.packPrice) / 100
      extrasCost += lineCost
      extraLines.push({
        stockItemId: item.id,
        name: item.name,
        quantity: 1,
        unitLabel: '%',
        unitPrice: item.packPrice,
        cost: lineCost,
      })
      continue
    }
    const qty = Number.isFinite(extra.quantity) && extra.quantity > 0 ? extra.quantity : 1
    const price = unitPrice(item)
    // накладной расход фиксированной суммой добавляется один раз на заказ
    const lineCost = price * (item.type === 'overhead' ? 1 : qty)
    extrasCost += lineCost
    extraLines.push({
      stockItemId: item.id,
      name: item.name,
      quantity: item.type === 'overhead' ? 1 : qty,
      unitLabel: stockUnitLabel(item),
      unitPrice: price,
      cost: lineCost,
    })
  }

  const totalCost = productCost + extrasCost
  const markup = Number.isFinite(markupPercent) ? markupPercent : 0
  const priceBeforeRounding = totalCost * (1 + markup / 100)
  const finalPrice = roundPriceUp(priceBeforeRounding, roundingStep)
  const profit = finalPrice - totalCost
  const marginPercent = finalPrice > 0 ? (profit / finalPrice) * 100 : 0

  return {
    share,
    productWeight,
    productPieces,
    productCost,
    extrasCost,
    totalCost,
    priceBeforeRounding,
    finalPrice,
    profit,
    marginPercent,
    extraLines,
    missingIds,
    warnings,
  }
}
