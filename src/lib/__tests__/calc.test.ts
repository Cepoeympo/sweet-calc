import { describe, expect, it } from 'vitest'
import {
  calculateOrder,
  calculateRecipeCost,
  orderShare,
  roundPriceUp,
  unitPrice,
  unitPricePer100,
} from '@/lib/calc'
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
    name: 'Тестовый зефир',
    image: { kind: 'preset', presetId: 'marshmallow-swirl' },
    items: [],
    finalWeight: 1000,
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  }
}

const sugar = makeStock({ id: 'sugar', name: 'Сахар', packAmount: 1000, packPrice: 80 })
const puree = makeStock({ id: 'puree', name: 'Пюре яблочное', packAmount: 500, packPrice: 250 })
const box = makeStock({ id: 'box', type: 'unit', name: 'Коробка', packAmount: 100, packPrice: 600 })
const electricity = makeStock({
  id: 'power',
  type: 'overhead',
  name: 'Электричество',
  packAmount: 1,
  packPrice: 100,
  overheadMode: 'fixed',
})
const percentFee = makeStock({
  id: 'percent',
  type: 'overhead',
  name: 'Амортизация',
  packAmount: 1,
  packPrice: 10,
  overheadMode: 'percent',
})

const stockMap = new Map([sugar, puree, box, electricity, percentFee].map((item) => [item.id, item]))

describe('unitPrice', () => {
  it('считает цену грамма для продукта', () => {
    expect(unitPrice(makeStock({ id: 'a', packAmount: 900, packPrice: 180 }))).toBeCloseTo(0.2, 10)
  })

  it('считает цену штуки для упаковки', () => {
    expect(unitPrice(box)).toBeCloseTo(6, 10)
  })

  it('для накладных расходов возвращает сумму', () => {
    expect(unitPrice(electricity)).toBe(100)
  })

  it('не делит на ноль и отбрасывает отрицательные цены', () => {
    expect(unitPrice(makeStock({ id: 'z', packAmount: 0, packPrice: 100 }))).toBe(0)
    expect(unitPrice(makeStock({ id: 'n', packAmount: 100, packPrice: -5 }))).toBe(0)
    expect(unitPrice(undefined)).toBe(0)
  })

  it('показывает цену за 100 г для продуктов', () => {
    expect(unitPricePer100(sugar)).toBeCloseTo(8, 10)
    expect(unitPricePer100(box)).toBeCloseTo(6, 10)
  })
})

describe('calculateRecipeCost', () => {
  const recipe = makeRecipe({
    items: [
      { stockItemId: 'sugar', amount: 500 },
      { stockItemId: 'puree', amount: 300 },
    ],
    finalWeight: 700,
    finalPieces: 10,
  })

  it('суммирует себестоимость партии', () => {
    const result = calculateRecipeCost(recipe, stockMap)
    expect(result.batchCost).toBeCloseTo(190, 10)
    expect(result.lines).toHaveLength(2)
    expect(result.lines[0].cost).toBeCloseTo(40, 10)
    expect(result.lines[1].cost).toBeCloseTo(150, 10)
  })

  it('считает себестоимость грамма и штуки', () => {
    const result = calculateRecipeCost(recipe, stockMap)
    expect(result.costPerGram).toBeCloseTo(190 / 700, 10)
    expect(result.costPerPiece).toBeCloseTo(19, 10)
  })

  it('возвращает null для штуки, если штуки не заданы', () => {
    const result = calculateRecipeCost(makeRecipe({ finalPieces: undefined }), stockMap)
    expect(result.costPerPiece).toBeNull()
  })

  it('помечает удалённые позиции склада и не ломает расчёт', () => {
    const broken = makeRecipe({ items: [{ stockItemId: 'ghost', amount: 100 }], finalWeight: 100 })
    const result = calculateRecipeCost(broken, stockMap)
    expect(result.batchCost).toBe(0)
    expect(result.missingIds).toEqual(['ghost'])
  })
})

describe('roundPriceUp', () => {
  it('округляет вверх до шага', () => {
    expect(roundPriceUp(1241, 50)).toBe(1250)
    expect(roundPriceUp(1200, 50)).toBe(1200)
    expect(roundPriceUp(1201, 100)).toBe(1300)
  })

  it('без шага оставляет сумму с точностью до копеек', () => {
    expect(roundPriceUp(1241.239, 0)).toBeCloseTo(1241.24, 6)
  })

  it('не возвращает отрицательные значения', () => {
    expect(roundPriceUp(-10, 10)).toBe(0)
    expect(roundPriceUp(Number.NaN, 10)).toBe(0)
  })
})

describe('orderShare', () => {
  it('считает долю по штукам', () => {
    expect(orderShare(makeRecipe({ finalPieces: 10 }), 'pieces', 9)).toBeCloseTo(0.9, 10)
  })

  it('считает долю по весу', () => {
    expect(orderShare(makeRecipe({ finalWeight: 1000 }), 'weight', 250)).toBeCloseTo(0.25, 10)
  })

  it('возвращает 0, если штуки не заданы', () => {
    expect(orderShare(makeRecipe({ finalPieces: undefined }), 'pieces', 6)).toBe(0)
  })
})

describe('calculateOrder', () => {
  const recipe = makeRecipe({
    items: [
      { stockItemId: 'sugar', amount: 500 },
      { stockItemId: 'puree', amount: 300 },
    ],
    finalWeight: 700,
    finalPieces: 10,
  })

  it('считает заказ на 9 штук с упаковкой и наценкой 150%', () => {
    const result = calculateOrder({
      recipe,
      stock: stockMap,
      mode: 'pieces',
      quantity: 9,
      extras: [{ stockItemId: 'box', quantity: 1 }],
      markupPercent: 150,
      roundingStep: 10,
    })

    expect(result.share).toBeCloseTo(0.9, 10)
    expect(result.productCost).toBeCloseTo(171, 10)
    expect(result.extrasCost).toBeCloseTo(6, 10)
    expect(result.totalCost).toBeCloseTo(177, 10)
    expect(result.priceBeforeRounding).toBeCloseTo(442.5, 10)
    expect(result.finalPrice).toBe(450)
    expect(result.profit).toBeCloseTo(273, 10)
    expect(result.productPieces).toBeCloseTo(9, 10)
    expect(result.productWeight).toBeCloseTo(630, 10)
  })

  it('учитывает накладные расходы процентом от себестоимости продукции', () => {
    const result = calculateOrder({
      recipe,
      stock: stockMap,
      mode: 'pieces',
      quantity: 9,
      extras: [
        { stockItemId: 'power', quantity: 1 },
        { stockItemId: 'percent', quantity: 1 },
      ],
      markupPercent: 0,
      roundingStep: 0,
    })

    expect(result.extrasCost).toBeCloseTo(100 + 17.1, 10)
    expect(result.totalCost).toBeCloseTo(288.1, 10)
    expect(result.finalPrice).toBeCloseTo(288.1, 10)
    expect(result.finalPrice).toBeLessThanOrEqual(result.totalCost + 10)
  })

  it('предупреждает, если в рецепте нет количества штук', () => {
    const result = calculateOrder({
      recipe: makeRecipe({ finalPieces: undefined }),
      stock: stockMap,
      mode: 'pieces',
      quantity: 6,
      extras: [],
      markupPercent: 100,
      roundingStep: 0,
    })
    expect(result.share).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('считает заказ по весу', () => {
    const result = calculateOrder({
      recipe,
      stock: stockMap,
      mode: 'weight',
      quantity: 350,
      extras: [],
      markupPercent: 100,
      roundingStep: 0,
    })
    // доля 0,5 → продукция 95 ₽, наценка 100% → 190 ₽
    expect(result.share).toBeCloseTo(0.5, 10)
    expect(result.productCost).toBeCloseTo(95, 10)
    expect(result.finalPrice).toBeCloseTo(190, 10)
    expect(result.productPieces).toBeCloseTo(5, 10)
  })
})
