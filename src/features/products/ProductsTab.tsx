import { useMemo, useState } from 'react'
import { Cake, Plus } from 'lucide-react'
import { RecipeImage } from '@/components/RecipeImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Fab } from '@/components/ui/Fab'
import { SearchInput } from '@/components/ui/SearchInput'
import { RecipeForm } from '@/features/products/RecipeForm'
import { RecipeView } from '@/features/products/RecipeView'
import { calculateRecipeCost } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { calculateNutritionPer100g } from '@/lib/nutrition'
import { useApp } from '@/store/useApp'

type Screen = { kind: 'list' } | { kind: 'view'; id: string } | { kind: 'edit'; id: string | null }

export function ProductsTab() {
  const { recipes, stockMap, saveRecipe, notify } = useApp()
  const [screen, setScreen] = useState<Screen>({ kind: 'list' })
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return recipes
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(search))
  }, [recipes, query])

  if (screen.kind === 'view') {
    const recipe = recipes.find((entry) => entry.id === screen.id)
    if (recipe) {
      return (
        <RecipeView
          recipe={recipe}
          onBack={() => setScreen({ kind: 'list' })}
          onEdit={() => setScreen({ kind: 'edit', id: recipe.id })}
        />
      )
    }
  }

  const editing =
    screen.kind === 'edit' && screen.id
      ? recipes.find((entry) => entry.id === screen.id) ?? null
      : null

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-ink">Продукция</h1>
        <p className="mt-0.5 text-xs text-muted">
          {recipes.length > 0 ? `Техкарт: ${recipes.length}` : 'Техкарт пока нет'}
        </p>
      </header>

      {recipes.length > 0 ? (
        <SearchInput value={query} onChange={setQuery} placeholder="Поиск по продукции" />
      ) : null}

      {recipes.length === 0 ? (
        <EmptyState
          icon={<Cake size={24} />}
          title="Ещё нет ни одной техкарты"
          description="Создайте рецепт: укажите состав со склада и фактический выход партии."
          action={
            <button
              type="button"
              onClick={() => setScreen({ kind: 'edit', id: null })}
              className="tap-none flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              <Plus size={16} /> Создать рецепт
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          По запросу «{query}» ничего не найдено.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((recipe) => {
            const cost = calculateRecipeCost(recipe, stockMap)
            const nutrition = calculateNutritionPer100g(recipe, stockMap)
            return (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => setScreen({ kind: 'view', id: recipe.id })}
                  className="tap-none flex w-full items-center gap-3 rounded-card border border-line bg-surface p-2.5 text-left shadow-card transition-colors hover:bg-surface-2/40"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-field bg-surface-2">
                    <RecipeImage image={recipe.image} alt={recipe.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-ink">{recipe.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatMoney(cost.costPerGram * 100)} / 100 г
                      {cost.costPerPiece !== null ? ` · ${formatMoney(cost.costPerPiece)} / шт` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {nutrition
                        ? `${Math.round(nutrition.kcal)} ккал на 100 г`
                        : 'КБЖУ не заполнено'}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Fab label="Создать рецепт" onClick={() => setScreen({ kind: 'edit', id: null })}>
        <Plus size={20} />
        Рецепт
      </Fab>

      <RecipeForm
        open={screen.kind === 'edit'}
        initial={editing}
        onClose={() => setScreen({ kind: 'list' })}
        onSubmit={async (recipe) => {
          await saveRecipe(recipe)
          notify(editing ? 'Техкарта обновлена' : 'Техкарта создана', 'success')
        }}
      />
    </div>
  )
}
