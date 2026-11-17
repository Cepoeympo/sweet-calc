import { uid } from '@/db/repo'
import type { NutritionPer100g, Recipe, StockItem } from '@/types'

interface DemoIngredient {
  key: string
  name: string
  packAmount: number
  packPrice: number
  nutrition: NutritionPer100g
  /** Сколько нужно на партию */
  amount: number
}

const DEMO_INGREDIENTS: DemoIngredient[] = [
  {
    key: 'demo-sugar',
    name: 'Сахар-песок',
    packAmount: 1000,
    packPrice: 85,
    nutrition: { kcal: 398, proteins: 0, fats: 0, carbs: 99.8 },
    amount: 350,
  },
  {
    key: 'demo-apple-puree',
    name: 'Пюре яблочное',
    packAmount: 1000,
    packPrice: 190,
    nutrition: { kcal: 52, proteins: 0.2, fats: 0.2, carbs: 12.8 },
    amount: 250,
  },
  {
    key: 'demo-egg-white',
    name: 'Яичный белок (сырой)',
    packAmount: 1000,
    packPrice: 320,
    nutrition: { kcal: 52, proteins: 10.9, fats: 0.2, carbs: 0.7 },
    amount: 50,
  },
  {
    key: 'demo-agar',
    name: 'Агар-агар',
    packAmount: 100,
    packPrice: 240,
    nutrition: { kcal: 306, proteins: 6.2, fats: 0.3, carbs: 80.9 },
    amount: 7,
  },
  {
    key: 'demo-water',
    name: 'Вода',
    packAmount: 1000,
    packPrice: 0,
    nutrition: { kcal: 0, proteins: 0, fats: 0, carbs: 0 },
    amount: 150,
  },
  {
    key: 'demo-citric',
    name: 'Кислота лимонная',
    packAmount: 100,
    packPrice: 90,
    nutrition: { kcal: 0, proteins: 0, fats: 0, carbs: 0 },
    amount: 1.5,
  },
]

export const DEMO_RECIPE_NAME = 'Зефир яблочный (демо)'

/**
 * Готовит демо-рецепт яблочного зефира.
 * Если ингредиент с таким названием уже есть на складе — используется он,
 * иначе создаётся новая позиция с ориентировочной ценой.
 */
export function createDemoRecipe(existingStock: StockItem[], now = Date.now()): {
  recipe: Recipe
  newStock: StockItem[]
} {
  const byName = new Map(existingStock.map((item) => [item.name.trim().toLowerCase(), item]))
  const newStock: StockItem[] = []
  const items = DEMO_INGREDIENTS.map((ingredient) => {
    const found = byName.get(ingredient.name.trim().toLowerCase())
    if (found) return { stockItemId: found.id, amount: ingredient.amount }

    const created: StockItem = {
      id: uid('stock'),
      type: 'food',
      name: ingredient.name,
      packAmount: ingredient.packAmount,
      packPrice: ingredient.packPrice,
      nutrition: ingredient.nutrition,
      updatedAt: now,
      createdAt: now,
    }
    newStock.push(created)
    return { stockItemId: created.id, amount: ingredient.amount }
  })

  return {
    recipe: {
      id: uid('recipe'),
      name: DEMO_RECIPE_NAME,
      image: { kind: 'preset', presetId: 'marshmallow-swirl' },
      items,
      finalWeight: 900,
      finalPieces: 12,
      notes:
        'Пюре яблочное прогреть до 85 °C. Сахар с агар-агаром и водой уварить до 110 °C. ' +
        'Белок взбить до устойчивых пиков, тонкой струйкой влить горячий сироп, взбивать 8–10 минут. ' +
        'В конце добавить пюре и лимонную кислоту, перемешать на низкой скорости. ' +
        'Отсадить через насадку «звезда» и сушить 6–8 часов при комнатной температуре.',
      createdAt: now,
      updatedAt: now,
    },
    newStock,
  }
}
