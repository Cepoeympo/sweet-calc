import { lookupStock, type StockSource } from '@/lib/calc'
import type { Recipe } from '@/types'

export type ScaleMode = 'pieces' | 'weight'

export interface ScaledIngredient {
  stockItemId: string
  name: string
  /** Исходная граммовка из техкарты */
  baseAmount: number
  /** Пересчитанная граммовка */
  amount: number
  unitLabel: string
}

export interface ScaledBatch {
  /** Во сколько раз масштабируется партия */
  factor: number
  /** Вес готовой партии в граммах */
  targetWeight: number
  /** Количество штук, если известно */
  targetPieces: number | null
  items: ScaledIngredient[]
}

function roundAmount(amount: number, unitLabel: string): number {
  if (!Number.isFinite(amount)) return 0
  // Умножение точнее деления на 0.1/0.5 и не даёт 83.2 вместо 83.3
  if (unitLabel === 'шт') return Math.round(amount * 2) / 2
  return Math.round(amount * 10) / 10
}

/**
 * Коэффициент пересчёта партии.
 * По штукам — targetPieces / finalPieces, по весу — targetWeight / finalWeight.
 */
export function scaleFactor(recipe: Recipe, mode: ScaleMode, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0
  if (mode === 'pieces') {
    const pieces = recipe.finalPieces ?? 0
    return pieces > 0 ? target / pieces : 0
  }
  return recipe.finalWeight > 0 ? target / recipe.finalWeight : 0
}

/** Пересчёт всех ингредиентов техкарты под нужный объём замеса. */
export function scaleRecipe(
  recipe: Recipe,
  stock: StockSource,
  mode: ScaleMode,
  target: number,
): ScaledBatch {
  const factor = scaleFactor(recipe, mode, target)
  const items: ScaledIngredient[] = []

  for (const ingredient of recipe.items) {
    const item = lookupStock(stock, ingredient.stockItemId)
    const unitLabel = item ? (item.type === 'unit' ? 'шт' : 'г') : 'г'
    const baseAmount = Number.isFinite(ingredient.amount) ? ingredient.amount : 0
    items.push({
      stockItemId: ingredient.stockItemId,
      name: item?.name ?? 'Удалённая позиция',
      baseAmount,
      amount: roundAmount(baseAmount * factor, unitLabel),
      unitLabel,
    })
  }

  const targetPieces =
    mode === 'pieces'
      ? target
      : recipe.finalPieces && recipe.finalPieces > 0
        ? recipe.finalPieces * factor
        : null

  return {
    factor,
    targetWeight: recipe.finalWeight * factor,
    targetPieces,
    items,
  }
}

/** Вес одной штуки, если заданы штуки. */
export function weightPerPiece(recipe: Recipe): number | null {
  const pieces = recipe.finalPieces ?? 0
  if (pieces <= 0 || recipe.finalWeight <= 0) return null
  return recipe.finalWeight / pieces
}
