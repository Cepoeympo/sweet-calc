import { createContext } from 'react'
import type { ToastTone } from '@/components/ui/Toaster'
import type { Recipe, Settings, StockItem } from '@/types'

export interface AppContextValue {
  ready: boolean
  error: string | null
  settings: Settings
  stock: StockItem[]
  recipes: Recipe[]
  stockMap: Map<string, StockItem>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  saveStock: (item: StockItem) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  saveRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  duplicateRecipeById: (id: string) => Promise<Recipe | null>
  restorePackaging: () => Promise<number>
  loadDemoRecipe: () => Promise<void>
  reload: () => Promise<void>
  notify: (message: string, tone?: ToastTone) => void
}

export const AppContext = createContext<AppContextValue | null>(null)
