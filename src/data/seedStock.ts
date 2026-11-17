import { NUTRITION_PRESETS } from '@/data/nutritionPresets'
import type { StockItem } from '@/types'

/**
 * Стандартная упаковка и расходники. Цены нулевые — пользователь вписывает свои.
 */
export function createSeedPackaging(now = Date.now()): StockItem[] {
  const rows: { name: string; packAmount: number; packPrice: number }[] = [
    { name: 'Коробка на 6 шт', packAmount: 1, packPrice: 0 },
    { name: 'Коробка на 9 шт', packAmount: 1, packPrice: 0 },
    { name: 'Коробка на 12 шт', packAmount: 1, packPrice: 0 },
    { name: 'Коробка на 16 шт', packAmount: 1, packPrice: 0 },
    { name: 'Атласная лента (1 м)', packAmount: 1, packPrice: 0 },
    { name: 'Капсула бумажная / подложка', packAmount: 1, packPrice: 0 },
    { name: 'Наклейка «Ручная работа»', packAmount: 1, packPrice: 0 },
    { name: 'Пакет подарочный', packAmount: 1, packPrice: 0 },
    { name: 'Лист пергамента', packAmount: 1, packPrice: 0 },
  ]

  return rows.map((row, index) => ({
    id: `seed_unit_${index + 1}`,
    type: 'unit',
    name: row.name,
    packAmount: row.packAmount,
    packPrice: row.packPrice,
    updatedAt: now,
    createdAt: now,
  }))
}

/** Ингредиенты справочника, для которых упаковка по умолчанию 100 г (специи, желирующие). */
const SMALL_PACK_IDS = new Set([
  'agar-agar',
  'apple-pectin',
  'citrus-pectin',
  'pectin-nh',
  'gelatin-powder',
  'gelatin-leaf',
  'xanthan-gum',
  'guar-gum',
  'carrageenan',
  'modified-starch',
  'lemon-acid',
  'cinnamon',
  'vanilla-extract',
  'baking-powder',
  'soda',
])

/**
 * Все позиции встроенного справочника КБЖУ (104 наименования) попадают на склад
 * как продукты с фасовкой 1 кг (или 100 г для специй) и ценой 0 ₽.
 * КБЖУ подставляется из справочника, цену пользователь вписывает сам.
 */
export function createSeedIngredients(now = Date.now()): StockItem[] {
  return NUTRITION_PRESETS.map((preset) => ({
    id: `seed_food_${preset.id}`,
    type: 'food' as const,
    name: preset.name,
    packAmount: SMALL_PACK_IDS.has(preset.id) ? 100 : 1000,
    packPrice: 0,
    nutrition: {
      kcal: preset.kcal,
      proteins: preset.proteins,
      fats: preset.fats,
      carbs: preset.carbs,
    },
    updatedAt: now,
    createdAt: now,
  }))
}

/** Полный стартовый набор склада: упаковка и все ингредиенты справочника. */
export function createSeedStock(now = Date.now()): StockItem[] {
  return [...createSeedPackaging(now), ...createSeedIngredients(now)]
}
