import { describe, expect, it } from 'vitest'
import {
  calculateBatchNutrition,
  calculateNutritionPer100g,
  nutritionForPiece,
  nutritionForWeight,
} from '@/lib/nutrition'
import type { Recipe, StockItem } from '@/types'

function makeStock(partial: Partial<StockItem> & { id: string }): StockItem {
  const { id, ...rest } = partial
  return {
    id,
    type: 'food',
    name: rest.name ?? id,
    packAmount: 1000,
    packPrice: 100,
    updatedAt: 0,
    createdAt: 0,
    ...rest,
  }
}

function makeRecipe(partial: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    name: 'Тест',
    image: { kind: 'preset', presetId: 'marshmallow-swirl' },
    items: [],
    finalWeight: 1000,
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  }
}

const sugar = makeStock({
  id: 'sugar',
  nutrition: { kcal: 398, proteins: 0, fats: 0, carbs: 99.8 },
})
const puree = makeStock({
  id: 'puree',
  nutrition: { kcal: 52, proteins: 0.2, fats: 0.2, carbs: 12.8 },
})
const parchment = makeStock({
  id: 'parchment',
  type: 'unit',
  name: 'Пергамент',
  packAmount: 100,
  packPrice: 200,
})
const water = makeStock({ id: 'water', name: 'Вода', nutrition: {} })

const stock = new Map([sugar, puree, parchment, water].map((item) => [item.id, item]))

describe('calculateBatchNutrition', () => {
  it('суммирует КБЖУ партии с учётом массы ингредиентов', () => {
    const recipe = makeRecipe({
      items: [
        { stockItemId: 'sugar', amount: 500 },
        { stockItemId: 'puree', amount: 300 },
      ],
    })
    const result = calculateBatchNutrition(recipe, stock)
    expect(result.hasData).toBe(true)
    expect(result.totals.kcal).toBeCloseTo(1990 + 156, 6)
    expect(result.totals.carbs).toBeCloseTo(499 + 38.4, 6)
  })

  it('игнорирует расходники без КБЖУ', () => {
    const recipe = makeRecipe({
      items: [
        { stockItemId: 'sugar', amount: 100 },
        { stockItemId: 'parchment', amount: 2 },
      ],
    })
    const result = calculateBatchNutrition(recipe, stock)
    expect(result.totals.kcal).toBeCloseTo(398, 6)
  })

  it('трактует незаполненные поля как ноль', () => {
    const recipe = makeRecipe({ items: [{ stockItemId: 'water', amount: 500 }] })
    const result = calculateBatchNutrition(recipe, stock)
    expect(result.hasData).toBe(false)
    expect(result.totals).toEqual({ kcal: 0, proteins: 0, fats: 0, carbs: 0 })
  })
})

describe('calculateNutritionPer100g', () => {
  it('учитывает уварку и усушку через фактический вес партии', () => {
    const recipe = makeRecipe({
      items: [
        { stockItemId: 'sugar', amount: 500 },
        { stockItemId: 'puree', amount: 300 },
        { stockItemId: 'water', amount: 200 },
      ],
      finalWeight: 700,
    })
    const per100 = calculateNutritionPer100g(recipe, stock)
    expect(per100).not.toBeNull()
    // (1990 + 156) / 700 * 100
    expect(per100?.kcal).toBeCloseTo((2146 / 700) * 100, 6)
  })

  it('возвращает null, если КБЖУ не заполнено ни у одного ингредиента', () => {
    const recipe = makeRecipe({ items: [{ stockItemId: 'parchment', amount: 1 }] })
    expect(calculateNutritionPer100g(recipe, stock)).toBeNull()
  })

  it('возвращает null, если вес партии не задан', () => {
    const recipe = makeRecipe({
      items: [{ stockItemId: 'sugar', amount: 100 }],
      finalWeight: 0,
    })
    expect(calculateNutritionPer100g(recipe, stock)).toBeNull()
  })
})

describe('nutritionForWeight и nutritionForPiece', () => {
  const per100 = { kcal: 300, proteins: 10, fats: 5, carbs: 40 }

  it('пересчитывает КБЖУ на произвольный вес', () => {
    const result = nutritionForWeight(per100, 250)
    expect(result?.kcal).toBeCloseTo(750, 6)
    expect(result?.carbs).toBeCloseTo(100, 6)
  })

  it('считает КБЖУ одной штуки', () => {
    const recipe = makeRecipe({ finalWeight: 700, finalPieces: 10 })
    const result = nutritionForPiece(per100, recipe)
    expect(result?.kcal).toBeCloseTo(210, 6)
  })

  it('возвращает null без данных', () => {
    expect(nutritionForWeight(null, 100)).toBeNull()
    expect(nutritionForPiece(null, makeRecipe())).toBeNull()
  })
})
