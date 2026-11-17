import { useMemo, useState } from 'react'
import { Cake } from 'lucide-react'
import { RecipeImage } from '@/components/RecipeImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { calculateRecipeCost } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { calculateNutritionPer100g } from '@/lib/nutrition'
import type { Recipe, StockItem } from '@/types'

export function RecipeSelectModal({
  open,
  recipes,
  stockMap,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean
  recipes: Recipe[]
  stockMap: Map<string, StockItem>
  selectedId: string | null
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return recipes
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(search))
  }, [recipes, query])

  return (
    <Modal open={open} onClose={onClose} title="Выберите продукцию">
      <div className="flex flex-col gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Название продукции" />

        {visible.length === 0 ? (
          <EmptyState
            icon={<Cake size={24} />}
            title="Ничего не найдено"
            description="Создайте техкарту на вкладке «Продукция»."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((recipe) => {
              const cost = calculateRecipeCost(recipe, stockMap)
              const nutrition = calculateNutritionPer100g(recipe, stockMap)
              const active = recipe.id === selectedId
              return (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(recipe)
                      onClose()
                    }}
                    className={`tap-none flex w-full items-center gap-3 rounded-field border p-2 text-left transition-colors ${
                      active ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2'
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      <RecipeImage image={recipe.image} alt={recipe.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{recipe.name}</p>
                      <p className="text-[11px] text-muted">
                        {formatMoney(cost.costPerGram * 100)} / 100 г
                        {nutrition ? ` · ${Math.round(nutrition.kcal)} ккал` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
