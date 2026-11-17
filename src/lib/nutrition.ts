import { lookupStock, type StockSource } from '@/lib/calc'
import type { NutritionPer100g, Recipe } from '@/types'

export interface NutritionTotals {
  kcal: number
  proteins: number
  fats: number
  carbs: number
}

export const ZERO_NUTRITION: NutritionTotals = { kcal: 0, proteins: 0, fats: 0, carbs: 0 }

function value(input: number | undefined): number {
  return typeof input === 'number' && Number.isFinite(input) ? input : 0
}

export function addNutrition(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    kcal: a.kcal + b.kcal,
    proteins: a.proteins + b.proteins,
    fats: a.fats + b.fats,
    carbs: a.carbs + b.carbs,
  }
}

export function scaleNutrition(totals: NutritionTotals, factor: number): NutritionTotals {
  const safe = Number.isFinite(factor) ? factor : 0
  return {
    kcal: totals.kcal * safe,
    proteins: totals.proteins * safe,
    fats: totals.fats * safe,
    carbs: totals.carbs * safe,
  }
}

/** Есть ли в ингредиенте хоть одно заполненное поле КБЖУ. */
export function hasNutritionData(nutrition: NutritionPer100g | undefined): boolean {
  if (!nutrition) return false
  return (
    nutrition.kcal !== undefined ||
    nutrition.proteins !== undefined ||
    nutrition.fats !== undefined ||
    nutrition.carbs !== undefined
  )
}

export interface BatchNutrition {
  totals: NutritionTotals
  /** Есть ли данные хотя бы у одного ингредиента */
  hasData: boolean
}

/**
 * КБЖУ всей партии: сумма по ингредиентам с учётом их массы.
 * Незаполненные поля считаются нулём (по требованиям задачи).
 */
export function calculateBatchNutrition(recipe: Recipe, stock: StockSource): BatchNutrition {
  let totals: NutritionTotals = { ...ZERO_NUTRITION }
  let hasData = false

  for (const ingredient of recipe.items) {
    const item = lookupStock(stock, ingredient.stockItemId)
    if (!item || !hasNutritionData(item.nutrition)) continue

    const amount = Number.isFinite(ingredient.amount) && ingredient.amount > 0 ? ingredient.amount : 0
    if (amount === 0) continue

    hasData = true
    const factor = amount / 100
    totals = addNutrition(totals, {
      kcal: value(item.nutrition?.kcal) * factor,
      proteins: value(item.nutrition?.proteins) * factor,
      fats: value(item.nutrition?.fats) * factor,
      carbs: value(item.nutrition?.carbs) * factor,
    })
  }

  return { totals, hasData }
}

/**
 * КБЖУ на 100 г готового продукта — с учётом уварки/усушки:
 * (сумма КБЖУ партии / фактический вес партии) × 100.
 */
export function calculateNutritionPer100g(
  recipe: Recipe,
  stock: StockSource,
): NutritionTotals | null {
  const { totals, hasData } = calculateBatchNutrition(recipe, stock)
  if (!hasData || !recipe.finalWeight || recipe.finalWeight <= 0) return null
  return scaleNutrition(totals, 100 / recipe.finalWeight)
}

/** КБЖУ порции (заказа) по её весу. */
export function nutritionForWeight(per100g: NutritionTotals | null, grams: number): NutritionTotals | null {
  if (!per100g || !Number.isFinite(grams) || grams <= 0) return null
  return scaleNutrition(per100g, grams / 100)
}

/** КБЖУ одной штуки: вес партии / количество штук. */
export function nutritionForPiece(
  per100g: NutritionTotals | null,
  recipe: Recipe,
): NutritionTotals | null {
  if (!per100g) return null
  const pieces = recipe.finalPieces ?? 0
  if (pieces <= 0 || recipe.finalWeight <= 0) return null
  return nutritionForWeight(per100g, recipe.finalWeight / pieces)
}
