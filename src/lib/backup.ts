import {
  getSettings,
  listRecipes,
  listStock,
  replaceAllRecipes,
  replaceAllStock,
  saveSettings,
  uid,
  upsertRecipes,
  upsertStockItems,
} from '@/db/repo'
import { DEFAULT_PLACEHOLDER_ID, PLACEHOLDERS } from '@/data/placeholders'
import type { NutritionPer100g, Recipe, RecipeImage, Settings, StockItem } from '@/types'

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupFile {
  app: 'sweet-calc'
  schemaVersion: number
  exportedAt: string
  stock: StockItem[]
  recipes: Recipe[]
  settings: Partial<Settings>
}

export type ImportMode = 'replace' | 'merge'

export interface ImportSummary {
  mode: ImportMode
  stockInFile: number
  recipesInFile: number
  stockAdded: number
  recipesAdded: number
  settingsRestored: boolean
}

/* ─────────────────────────  Экспорт  ───────────────────────── */

/** Полный слепок базы. Токен GitHub Gist в файл не попадает. */
export async function createBackupPayload(): Promise<BackupFile> {
  const [stock, recipes, settings] = await Promise.all([listStock(), listRecipes(), getSettings()])
  const { gistToken: _ignored, ...safeSettings } = settings

  return {
    app: 'sweet-calc',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    stock,
    recipes,
    settings: safeSettings,
  }
}

export function backupFileName(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `sweet-calc-backup-${year}-${month}-${day}.json`
}

export function downloadJsonFile(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportBackupToFile(): Promise<string> {
  const payload = await createBackupPayload()
  const fileName = backupFileName()
  downloadJsonFile(payload, fileName)
  return fileName
}

/* ─────────────────────────  Импорт  ───────────────────────── */

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback
}

function normalizeNutrition(raw: Record<string, unknown>): NutritionPer100g | undefined {
  const result: NutritionPer100g = {}
  const keys: (keyof NutritionPer100g)[] = ['proteins', 'fats', 'carbs', 'kcal']
  let hasValue = false

  for (const key of keys) {
    const value = raw[key]
    if (value === null || value === undefined || value === '') continue
    const parsed = num(value, Number.NaN)
    if (Number.isFinite(parsed)) {
      result[key] = parsed
      hasValue = true
    }
  }

  return hasValue ? result : undefined
}

function normalizeStockItem(raw: unknown): StockItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const name = typeof item.name === 'string' ? item.name.trim() : ''
  if (!name) return null

  const now = Date.now()
  const type: StockItem['type'] =
    item.type === 'unit' || item.type === 'overhead' ? item.type : 'food'
  const nutrition =
    type === 'food' && item.nutrition && typeof item.nutrition === 'object'
      ? normalizeNutrition(item.nutrition as Record<string, unknown>)
      : undefined

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : uid('stock'),
    type,
    name,
    packAmount: Math.max(num(item.packAmount, 1), 0),
    packPrice: Math.max(num(item.packPrice, 0), 0),
    overheadMode: type === 'overhead' ? (item.overheadMode === 'percent' ? 'percent' : 'fixed') : undefined,
    nutrition,
    updatedAt: num(item.updatedAt, now),
    createdAt: num(item.createdAt, now),
  }
}

function normalizeImage(raw: unknown): RecipeImage {
  if (raw && typeof raw === 'object') {
    const image = raw as Record<string, unknown>
    if (image.kind === 'custom' && typeof image.dataUrl === 'string' && image.dataUrl.startsWith('data:')) {
      return { kind: 'custom', dataUrl: image.dataUrl }
    }
    if (image.kind === 'preset' && typeof image.presetId === 'string') {
      const presetId = PLACEHOLDERS.some((preset) => preset.id === image.presetId)
        ? image.presetId
        : DEFAULT_PLACEHOLDER_ID
      return { kind: 'preset', presetId }
    }
  }
  return { kind: 'preset', presetId: DEFAULT_PLACEHOLDER_ID }
}

function normalizeRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const name = typeof item.name === 'string' ? item.name.trim() : ''
  if (!name) return null

  const items = Array.isArray(item.items)
    ? item.items
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null
          const ingredient = entry as Record<string, unknown>
          const stockItemId = typeof ingredient.stockItemId === 'string' ? ingredient.stockItemId : ''
          const amount = num(ingredient.amount, 0)
          if (!stockItemId || amount <= 0) return null
          return { stockItemId, amount }
        })
        .filter((entry): entry is { stockItemId: string; amount: number } => entry !== null)
    : []

  const now = Date.now()
  const finalPieces = num(item.finalPieces, 0)

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : uid('recipe'),
    name,
    image: normalizeImage(item.image),
    items,
    finalWeight: Math.max(num(item.finalWeight, 0), 0),
    finalPieces: finalPieces > 0 ? finalPieces : undefined,
    notes: typeof item.notes === 'string' ? item.notes : undefined,
    createdAt: num(item.createdAt, now),
    updatedAt: num(item.updatedAt, now),
  }
}

/** Разбор и валидация JSON-файла резервной копии. */
export function parseBackupJson(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Файл не является корректным JSON.')
  }

  if (!data || typeof data !== 'object') throw new Error('Не удалось прочитать файл резервной копии.')
  const raw = data as Partial<BackupFile>
  if (raw.app !== 'sweet-calc') throw new Error('Это не резервная копия Sweet Calc.')
  if (!Array.isArray(raw.stock) || !Array.isArray(raw.recipes)) {
    throw new Error('В файле отсутствуют склад или рецепты.')
  }

  return {
    app: 'sweet-calc',
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    stock: raw.stock
      .map(normalizeStockItem)
      .filter((entry): entry is StockItem => entry !== null),
    recipes: raw.recipes
      .map(normalizeRecipe)
      .filter((entry): entry is Recipe => entry !== null),
    settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : {},
  }
}

/** Применение резервной копии: полная замена или добавление недостающего. */
export async function applyBackup(backup: BackupFile, mode: ImportMode): Promise<ImportSummary> {
  if (mode === 'replace') {
    await replaceAllStock(backup.stock)
    await replaceAllRecipes(backup.recipes)

    const current = await getSettings()
    const restored: Partial<Settings> = { ...backup.settings }
    delete (restored as Record<string, unknown>).gistToken
    await saveSettings({ ...restored, gistToken: current.gistToken })

    return {
      mode,
      stockInFile: backup.stock.length,
      recipesInFile: backup.recipes.length,
      stockAdded: backup.stock.length,
      recipesAdded: backup.recipes.length,
      settingsRestored: true,
    }
  }

  const [existingStock, existingRecipes] = await Promise.all([listStock(), listRecipes()])
  const stockIds = new Set(existingStock.map((item) => item.id))
  const recipeIds = new Set(existingRecipes.map((item) => item.id))

  const stockToAdd = backup.stock.filter((item) => !stockIds.has(item.id))
  const recipesToAdd = backup.recipes.filter((item) => !recipeIds.has(item.id))

  await upsertStockItems(stockToAdd)
  await upsertRecipes(recipesToAdd)

  return {
    mode,
    stockInFile: backup.stock.length,
    recipesInFile: backup.recipes.length,
    stockAdded: stockToAdd.length,
    recipesAdded: recipesToAdd.length,
    settingsRestored: false,
  }
}
