import { lookupStock, type OrderMode, type OrderResult, type StockSource } from '@/lib/calc'
import { formatMoney, formatNumber, formatWeight } from '@/lib/format'
import {
  calculateNutritionPer100g,
  nutritionForPiece,
  nutritionForWeight,
  type NutritionTotals,
} from '@/lib/nutrition'
import type { Recipe } from '@/types'

function macroLine(totals: NutritionTotals): string {
  return (
    `белки ${formatNumber(totals.proteins, 1)} г · ` +
    `жиры ${formatNumber(totals.fats, 1)} г · ` +
    `углеводы ${formatNumber(totals.carbs, 1)} г · ` +
    `${formatNumber(totals.kcal, 0)} ккал`
  )
}

/** Текст для отправки клиенту: состав по убыванию массы, вес, КБЖУ и цена. */
export function buildClientText(input: {
  recipe: Recipe
  stock: StockSource
  result: OrderResult
  mode: OrderMode
  quantity: number
}): string {
  const { recipe, stock, result, mode, quantity } = input

  const composition = recipe.items
    .map((ingredient) => {
      const item = lookupStock(stock, ingredient.stockItemId)
      if (!item || item.type !== 'food') return null
      return { name: item.name.toLowerCase(), amount: ingredient.amount }
    })
    .filter((entry): entry is { name: string; amount: number } => entry !== null)
    .sort((a, b) => b.amount - a.amount)
    .map((entry) => entry.name)

  const per100g = calculateNutritionPer100g(recipe, stock)
  const orderNutrition = nutritionForWeight(per100g, result.productWeight)
  const pieceNutrition = nutritionForPiece(per100g, recipe)

  const quantityLine =
    mode === 'pieces'
      ? `${formatNumber(quantity, 0)} шт · ${formatWeight(result.productWeight)}`
      : `${formatWeight(quantity)}${result.productPieces ? ` · ${formatNumber(result.productPieces, 0)} шт` : ''}`

  const lines: string[] = [recipe.name, quantityLine, '']

  if (composition.length > 0) {
    lines.push(`Состав: ${composition.join(', ')}.`)
    lines.push('')
  }

  if (per100g) {
    lines.push(`КБЖУ на 100 г: ${macroLine(per100g)}.`)
  }

  if (orderNutrition) {
    lines.push(`КБЖУ на заказ (${formatWeight(result.productWeight)}): ${macroLine(orderNutrition)}.`)
  }

  if (pieceNutrition && mode === 'weight') {
    lines.push(`КБЖУ на 1 шт: ${macroLine(pieceNutrition)}.`)
  }

  lines.push('')
  lines.push(`Цена: ${formatMoney(result.finalPrice)}`)

  return lines.join('\n')
}
