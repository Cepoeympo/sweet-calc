import { describe, expect, it } from 'vitest'
import {
  findNutritionPresetByName,
  searchNutritionPresets,
  NUTRITION_PRESETS,
} from '@/data/nutritionPresets'
import { createSeedIngredients, createSeedStock } from '@/data/seedStock'

/**
 * Позиции, для которых расчёт по Атуотеру (4/9/4) заведомо расходится
 * с официальной калорийностью: полиолы (2–2,6 ккал/г), клетчатка (2 ккал/г),
 * алкоголь в экстракте (7 ккал/г) и органические кислоты.
 */
const ATWATER_EXCEPTIONS = new Set([
  'erythritol',
  'isomalt',
  'xylitol',
  'sorbitol',
  'agar-agar',
  'guar-gum',
  'carrageenan',
  'cocoa-powder',
  'cinnamon',
  'vanilla-extract',
  'baking-powder',
  'lemon-juice',
  'apple-fresh',
])

describe('справочник КБЖУ', () => {
  it('содержит не менее 90 позиций', () => {
    expect(NUTRITION_PRESETS.length).toBeGreaterThanOrEqual(90)
  })

  it('не содержит дубликатов идентификаторов и названий', () => {
    const ids = new Set<string>()
    const names = new Set<string>()
    for (const preset of NUTRITION_PRESETS) {
      expect(ids.has(preset.id), `повтор id: ${preset.id}`).toBe(false)
      expect(names.has(preset.name), `повтор названия: ${preset.name}`).toBe(false)
      ids.add(preset.id)
      names.add(preset.name)
    }
  })

  it('держит значения в физически допустимых диапазонах', () => {
    for (const preset of NUTRITION_PRESETS) {
      expect(preset.kcal, preset.id).toBeGreaterThanOrEqual(0)
      expect(preset.kcal, preset.id).toBeLessThanOrEqual(900)
      expect(preset.proteins, preset.id).toBeGreaterThanOrEqual(0)
      expect(preset.proteins, preset.id).toBeLessThanOrEqual(100)
      expect(preset.fats, preset.id).toBeGreaterThanOrEqual(0)
      expect(preset.fats, preset.id).toBeLessThanOrEqual(100)
      expect(preset.carbs, preset.id).toBeGreaterThanOrEqual(0)
      expect(preset.carbs, preset.id).toBeLessThanOrEqual(100)
      expect(preset.proteins + preset.fats + preset.carbs, preset.id).toBeLessThanOrEqual(100.5)
    }
  })

  it('согласует калорийность с белками, жирами и углеводами', () => {
    const problems: string[] = []

    for (const preset of NUTRITION_PRESETS) {
      if (ATWATER_EXCEPTIONS.has(preset.id)) continue
      const calculated = preset.proteins * 4 + preset.fats * 9 + preset.carbs * 4
      const tolerance = Math.max(8, preset.kcal * 0.16)
      if (Math.abs(calculated - preset.kcal) > tolerance) {
        problems.push(
          `${preset.id}: ккал ${preset.kcal}, по БЖУ ${calculated.toFixed(0)}`,
        )
      }
    }

    expect(problems).toEqual([])
  })

  it('находит продукт по точному названию и алиасу', () => {
    expect(findNutritionPresetByName('сахар-песок')?.id).toBe('sugar')
    expect(findNutritionPresetByName('пудра')?.id).toBe('powdered-sugar')
    expect(findNutritionPresetByName('неизвестный продукт')).toBeUndefined()
  })

  it('возвращает подсказки по частичному совпадению', () => {
    const results = searchNutritionPresets('пекти')
    expect(results.map((item) => item.id)).toContain('apple-pectin')
    expect(searchNutritionPresets('п')).toEqual([])
  })
})

describe('стартовое наполнение склада', () => {
  it('добавляет все ингредиенты справочника с ценой 0', () => {
    const items = createSeedIngredients(1000)
    expect(items).toHaveLength(NUTRITION_PRESETS.length)
    for (const item of items) {
      expect(item.type).toBe('food')
      expect(item.packPrice).toBe(0)
      expect(item.packAmount).toBeGreaterThan(0)
      expect(item.nutrition?.kcal).toBeDefined()
    }
  })

  it('добавляет упаковку и ингредиенты без пересечения названий', () => {
    const stock = createSeedStock(1000)
    const names = stock.map((item) => item.name.trim().toLowerCase())
    expect(new Set(names).size).toBe(names.length)

    const packaging = stock.filter((item) => item.type === 'unit')
    const food = stock.filter((item) => item.type === 'food')
    expect(packaging).toHaveLength(9)
    expect(food).toHaveLength(NUTRITION_PRESETS.length)
  })
})
