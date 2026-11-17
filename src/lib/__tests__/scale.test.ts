import { describe, expect, it } from 'vitest'
import { scaleFactor, scaleRecipe, weightPerPiece } from '@/lib/scale'
import type { Recipe, StockItem } from '@/types'

const sugar: StockItem = {
  id: 'sugar',
  type: 'food',
  name: 'Сахар',
  packAmount: 1000,
  packPrice: 80,
  updatedAt: 0,
  createdAt: 0,
}

const parchment: StockItem = {
  id: 'parchment',
  type: 'unit',
  name: 'Пергамент',
  packAmount: 100,
  packPrice: 200,
  updatedAt: 0,
  createdAt: 0,
}

const stock = new Map([sugar, parchment].map((item) => [item.id, item]))

const recipe: Recipe = {
  id: 'r1',
  name: 'Зефир',
  image: { kind: 'preset', presetId: 'marshmallow-swirl' },
  items: [
    { stockItemId: 'sugar', amount: 600 },
    { stockItemId: 'parchment', amount: 2 },
  ],
  finalWeight: 1000,
  finalPieces: 12,
  createdAt: 0,
  updatedAt: 0,
}

describe('scaleFactor', () => {
  it('считает коэффициент по штукам', () => {
    expect(scaleFactor(recipe, 'pieces', 6)).toBeCloseTo(0.5, 10)
  })

  it('считает коэффициент по весу', () => {
    expect(scaleFactor(recipe, 'weight', 250)).toBeCloseTo(0.25, 10)
  })

  it('возвращает 0 при нулевом или отрицательном запросе', () => {
    expect(scaleFactor(recipe, 'weight', 0)).toBe(0)
    expect(scaleFactor(recipe, 'pieces', -5)).toBe(0)
  })

  it('возвращает 0, если в рецепте нет штук', () => {
    expect(scaleFactor({ ...recipe, finalPieces: undefined }, 'pieces', 6)).toBe(0)
  })
})

describe('scaleRecipe', () => {
  it('пересчитывает граммовки под половину партии', () => {
    const result = scaleRecipe(recipe, stock, 'pieces', 6)
    expect(result.factor).toBeCloseTo(0.5, 10)
    expect(result.targetWeight).toBeCloseTo(500, 10)
    expect(result.targetPieces).toBe(6)
    expect(result.items[0].amount).toBeCloseTo(300, 6)
    expect(result.items[1].amount).toBeCloseTo(1, 6)
    expect(result.items[0].unitLabel).toBe('г')
    expect(result.items[1].unitLabel).toBe('шт')
  })

  it('пересчитывает граммовки под нужный вес', () => {
    const result = scaleRecipe(recipe, stock, 'weight', 250)
    expect(result.targetWeight).toBeCloseTo(250, 10)
    expect(result.items[0].amount).toBeCloseTo(150, 6)
    expect(result.targetPieces).toBeCloseTo(3, 6)
  })

  it('округляет граммовки до 0,1 г', () => {
    const odd: Recipe = {
      ...recipe,
      items: [{ stockItemId: 'sugar', amount: 333 }],
      finalWeight: 1000,
      finalPieces: undefined,
    }
    const result = scaleRecipe(odd, stock, 'weight', 250)
    expect(result.items[0].amount).toBeCloseTo(83.3, 6)
  })

  it('не падает на удалённой позиции склада', () => {
    const broken: Recipe = { ...recipe, items: [{ stockItemId: 'ghost', amount: 100 }] }
    const result = scaleRecipe(broken, stock, 'weight', 500)
    expect(result.items[0].name).toBe('Удалённая позиция')
    expect(result.items[0].amount).toBeCloseTo(50, 6)
  })
})

describe('weightPerPiece', () => {
  it('считает вес штуки', () => {
    expect(weightPerPiece(recipe)).toBeCloseTo(1000 / 12, 10)
  })

  it('возвращает null без штук', () => {
    expect(weightPerPiece({ ...recipe, finalPieces: 0 })).toBeNull()
  })
})
