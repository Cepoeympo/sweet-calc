import { openDB, deleteDB as idbDeleteDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Recipe, Settings, StockItem, StockType } from '@/types'

export interface SettingsRecord extends Settings {
  key: string
}

export interface MetaRecord {
  key: string
  value: unknown
}

interface SweetCalcSchema extends DBSchema {
  stock: {
    key: string
    value: StockItem
    indexes: { 'by-type': StockType; 'by-name': string }
  }
  recipes: {
    key: string
    value: Recipe
    indexes: { 'by-name': string }
  }
  settings: {
    key: string
    value: SettingsRecord
  }
  meta: {
    key: string
    value: MetaRecord
  }
}

export const DB_NAME = 'sweet-calc'
export const DB_VERSION = 1
export const SETTINGS_KEY = 'app'

let dbPromise: Promise<IDBPDatabase<SweetCalcSchema>> | null = null

export function getDB(): Promise<IDBPDatabase<SweetCalcSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<SweetCalcSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('stock')) {
          const store = db.createObjectStore('stock', { keyPath: 'id' })
          store.createIndex('by-type', 'type')
          store.createIndex('by-name', 'name')
        }
        if (!db.objectStoreNames.contains('recipes')) {
          const store = db.createObjectStore('recipes', { keyPath: 'id' })
          store.createIndex('by-name', 'name')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
      blocking() {
        console.warn('Sweet Calc: база заблокирована другой вкладкой, перезагрузите страницу')
      },
    })
  }
  return dbPromise
}

/** Полное удаление базы — используется при восстановлении бэкапа в режиме «Заменить». */
export async function dropDatabase(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // база могла не открыться — игнорируем
    }
    dbPromise = null
  }
  await idbDeleteDB(DB_NAME)
}

export type SweetCalcDB = IDBPDatabase<SweetCalcSchema>
