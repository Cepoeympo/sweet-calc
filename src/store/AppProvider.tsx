import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Toaster, type ToastMessage, type ToastTone } from '@/components/ui/Toaster'
import { createDemoRecipe } from '@/data/demoRecipe'
import { DEFAULT_SETTINGS } from '@/data/defaults'
import {
  deleteRecipe as deleteRecipeRecord,
  deleteStockItem,
  duplicateRecipe as duplicateRecipeRecord,
  ensureSeedStock,
  getSettings,
  listRecipes,
  listStock,
  restoreSeedStock,
  saveRecipe as saveRecipeRecord,
  saveSettings,
  saveStockItem,
  uid,
  upsertStockItems,
} from '@/db/repo'
import { buildStockMap } from '@/lib/calc'
import { AppContext, type AppContextValue } from '@/store/app-context'
import { applyTheme, watchSystemTheme } from '@/theme/theme'
import type { Recipe, Settings, StockItem } from '@/types'

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [stock, setStock] = useState<StockItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = uid('toast')
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const reload = useCallback(async () => {
    const [nextSettings, nextStock, nextRecipes] = await Promise.all([
      getSettings(),
      listStock(),
      listRecipes(),
    ])
    setSettings(nextSettings)
    setStock(nextStock)
    setRecipes(nextRecipes)
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        await ensureSeedStock()
        if (cancelled) return
        await reload()
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Не удалось открыть локальную базу')
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [reload])

  useEffect(() => {
    applyTheme(settings.theme, settings.accentId)
  }, [settings.theme, settings.accentId])

  useEffect(() => {
    if (settings.theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system', settings.accentId))
  }, [settings.theme, settings.accentId])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await saveSettings(patch)
    setSettings(next)
  }, [])

  const saveStock = useCallback(async (item: StockItem) => {
    await saveStockItem(item)
    setStock(await listStock())
  }, [])

  const deleteStock = useCallback(async (id: string) => {
    await deleteStockItem(id)
    setStock(await listStock())
  }, [])

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    await saveRecipeRecord(recipe)
    setRecipes(await listRecipes())
  }, [])

  const deleteRecipe = useCallback(async (id: string) => {
    await deleteRecipeRecord(id)
    setRecipes(await listRecipes())
  }, [])

  const duplicateRecipeById = useCallback(
    async (id: string) => {
      const copy = await duplicateRecipeRecord(id)
      if (copy) {
        setRecipes(await listRecipes())
        notify('Рецепт скопирован', 'success')
      }
      return copy
    },
    [notify],
  )

  const restorePackaging = useCallback(async () => {
    const added = await restoreSeedStock()
    setStock(await listStock())
    notify(
      added > 0
        ? `Добавлено позиций склада: ${added}`
        : 'Все стандартные позиции уже есть на складе',
      added > 0 ? 'success' : 'info',
    )
    return added
  }, [notify])

  const loadDemoRecipe = useCallback(async () => {
    const currentStock = await listStock()
    const { recipe, newStock } = createDemoRecipe(currentStock)
    if (newStock.length > 0) await upsertStockItems(newStock)
    await saveRecipeRecord(recipe)
    await reload()
    notify('Демо-рецепт яблочного зефира добавлен', 'success')
  }, [notify, reload])

  const stockMap = useMemo(() => buildStockMap(stock), [stock])

  const value: AppContextValue = useMemo(
    () => ({
      ready,
      error,
      settings,
      stock,
      recipes,
      stockMap,
      updateSettings,
      saveStock,
      deleteStock,
      saveRecipe,
      deleteRecipe,
      duplicateRecipeById,
      restorePackaging,
      loadDemoRecipe,
      reload,
      notify,
    }),
    [
      ready,
      error,
      settings,
      stock,
      recipes,
      stockMap,
      updateSettings,
      saveStock,
      deleteStock,
      saveRecipe,
      deleteRecipe,
      duplicateRecipeById,
      restorePackaging,
      loadDemoRecipe,
      reload,
      notify,
    ],
  )

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppContext.Provider>
  )
}
