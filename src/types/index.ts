/** Типы предметной области Sweet Calc. */
export type StockType = 'food' | 'unit' | 'overhead'

/** Режим накладных расходов: фиксированная сумма в рублях или процент от себестоимости. */
export type OverheadMode = 'fixed' | 'percent'

/** КБЖУ на 100 г. Любое поле может отсутствовать — в расчётах считается как 0. */
export interface NutritionPer100g {
  proteins?: number
  fats?: number
  carbs?: number
  kcal?: number
}

/**
 * Позиция склада.
 * - food: продукт в граммах, packAmount — вес упаковки в г
 * - unit: штучный расходник, packAmount — количество в пачке в шт
 * - overhead: накладные расходы, packAmount = 1, packPrice — сумма или процент
 */
export interface StockItem {
  id: string
  type: StockType
  name: string
  packAmount: number
  packPrice: number
  overheadMode?: OverheadMode
  nutrition?: NutritionPer100g
  /** Время последнего изменения цены/фасовки, timestamp */
  updatedAt: number
  createdAt: number
}

export type RecipeImage =
  | { kind: 'custom'; dataUrl: string }
  | { kind: 'preset'; presetId: string }

/** Ингредиент техкарты: граммы для продуктов, штуки для технологических расходников. */
export interface RecipeIngredient {
  stockItemId: string
  amount: number
}

export interface Recipe {
  id: string
  name: string
  image: RecipeImage
  items: RecipeIngredient[]
  /** Фактический вес готовой партии в граммах, обязательное поле */
  finalWeight: number
  /** Количество штук на выходе; если > 0 включается поштучный расчёт */
  finalPieces?: number
  /** Заметки к техкарте: температуры, время взбивания, сушка */
  notes?: string
  createdAt: number
  updatedAt: number
}

export type ThemeMode = 'system' | 'light' | 'dark'

/** Шаг округления итоговой цены в рублях, 0 — без округления */
export type RoundingStep = 0 | 10 | 50 | 100

export interface Settings {
  theme: ThemeMode
  accentId: string
  /** Наценка по умолчанию, % */
  markupPercent: number
  roundingStep: RoundingStep
  /** GitHub Personal Access Token для Gist-синхронизации. Никогда не попадает в бэкап. */
  gistToken: string
  gistId: string
  /** Время последней успешной синхронизации, timestamp */
  lastSyncAt: number | null
}

/** Позиция комплектации заказа: упаковка, расходник или накладной расход. */
export interface OrderExtra {
  stockItemId: string
  /** Количество для food/unit; для overhead всегда 1 */
  quantity: number
}
