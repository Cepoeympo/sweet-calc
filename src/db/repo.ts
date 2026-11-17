import { getDB, SETTINGS_KEY, type SettingsRecord } from '@/db'
import { DEFAULT_SETTINGS } from '@/data/defaults'
import { createSeedStock } from '@/data/seedStock'
import type { Recipe, Settings, StockItem } from '@/types'

/** Генерация идентификаторов без внешних зависимостей. */
export function uid(prefix = 'id'): string {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return `${prefix}_${cryptoObj.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'ru')
}

/* ─────────────────────────────  Склад  ───────────────────────────── */

export async function listStock(): Promise<StockItem[]> {
  const db = await getDB()
  const items = await db.getAll('stock')
  return items.sort(byName)
}

export async function getStockItem(id: string): Promise<StockItem | undefined> {
  const db = await getDB()
  return db.get('stock', id)
}

export async function saveStockItem(item: StockItem): Promise<StockItem> {
  const db = await getDB()
  await db.put('stock', item)
  return item
}

export async function deleteStockItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('stock', id)
}

export async function countStock(): Promise<number> {
  const db = await getDB()
  return db.count('stock')
}

export async function upsertStockItems(items: StockItem[]): Promise<void> {
  if (items.length === 0) return
  const db = await getDB()
  const tx = db.transaction('stock', 'readwrite')
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

export async function replaceAllStock(items: StockItem[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('stock', 'readwrite')
  await tx.store.clear()
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

/* ────────────────────────────  Рецепты  ──────────────────────────── */

export async function listRecipes(): Promise<Recipe[]> {
  const db = await getDB()
  const items = await db.getAll('recipes')
  return items.sort(byName)
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const db = await getDB()
  return db.get('recipes', id)
}

export async function saveRecipe(recipe: Recipe): Promise<Recipe> {
  const db = await getDB()
  await db.put('recipes', recipe)
  return recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('recipes', id)
}

export async function upsertRecipes(items: Recipe[]): Promise<void> {
  if (items.length === 0) return
  const db = await getDB()
  const tx = db.transaction('recipes', 'readwrite')
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

export async function replaceAllRecipes(items: Recipe[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('recipes', 'readwrite')
  await tx.store.clear()
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

/** Полная копия техкарты с новым id и именем «(копия)». */
export async function duplicateRecipe(id: string): Promise<Recipe | null> {
  const recipe = await getRecipe(id)
  if (!recipe) return null
  const now = Date.now()
  const copy: Recipe = {
    ...structuredClone(recipe),
    id: uid('recipe'),
    name: `${recipe.name} (копия)`,
    createdAt: now,
    updatedAt: now,
  }
  await saveRecipe(copy)
  return copy
}

/* ────────────────────────────  Настройки  ────────────────────────── */

export async function getSettings(): Promise<Settings> {
  const db = await getDB()
  const record = await db.get('settings', SETTINGS_KEY)
  if (!record) return { ...DEFAULT_SETTINGS }
  // key — служебное поле хранилища, в модель настроек не попадает
  const { key: _key, ...stored } = record
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = { ...current, ...patch }
  const db = await getDB()
  const record: SettingsRecord = { key: SETTINGS_KEY, ...next }
  await db.put('settings', record)
  return next
}

/* ──────────────────────────────  meta  ───────────────────────────── */

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  const record = await db.get('meta', key)
  return record?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('meta', { key, value })
}

/* ──────────────────────────────  Сиды  ───────────────────────────── */

/** Версия стартового набора склада: 2 — упаковка + все ингредиенты справочника. */
const SEED_VERSION = 2

/** Добавляет недостающие позиции стартового набора, не дублируя названия. */
async function seedMissingItems(): Promise<number> {
  const existing = await listStock()
  const names = new Set(existing.map((item) => item.name.trim().toLowerCase()))
  const missing = createSeedStock().filter((item) => !names.has(item.name.trim().toLowerCase()))
  await upsertStockItems(missing)
  return missing.length
}

/**
 * Первый запуск и обновление с версии 1: склад получает стандартную упаковку
 * и все ингредиенты справочника КБЖУ с ценой 0 ₽.
 */
export async function ensureSeedStock(): Promise<boolean> {
  const version = await getMeta<number>('seedVersion')
  if (version === SEED_VERSION) return false
  const added = await seedMissingItems()
  await setMeta('seedVersion', SEED_VERSION)
  return added > 0
}

/** Кнопка в настройках: дозаполнить упаковку и ингредиенты, не трогая существующие цены. */
export async function restoreSeedStock(): Promise<number> {
  return seedMissingItems()
}
