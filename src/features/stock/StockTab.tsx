import { useMemo, useState } from 'react'
import { Package, Plus, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Fab } from '@/components/ui/Fab'
import { SearchInput } from '@/components/ui/SearchInput'
import { Segmented } from '@/components/ui/Segmented'
import { StockForm } from '@/features/stock/StockForm'
import { formatDate, formatMoney } from '@/lib/format'
import { stockUnitLabel, unitPrice, unitPricePer100 } from '@/lib/calc'
import { useApp } from '@/store/useApp'
import type { StockItem, StockType } from '@/types'

type Filter = 'all' | StockType

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'food', label: 'Продукты (г)' },
  { value: 'unit', label: 'Упаковка и штуки' },
  { value: 'overhead', label: 'Накладные' },
]

const TYPE_LABEL: Record<StockType, string> = {
  food: 'продукт',
  unit: 'шт',
  overhead: 'расход',
}

function priceCaption(item: StockItem): string {
  if (item.type === 'food') return `${formatMoney(unitPricePer100(item))} / 100 г`
  if (item.type === 'unit') return `${formatMoney(unitPrice(item))} / шт`
  return item.overheadMode === 'percent'
    ? `${item.packPrice}% от себестоимости`
    : `${formatMoney(item.packPrice)} разово`
}

function packCaption(item: StockItem): string {
  if (item.type === 'overhead') return 'накладной расход'
  return `${formatMoney(item.packPrice)} за ${item.packAmount} ${stockUnitLabel(item)}`
}

export function StockTab() {
  const { stock, saveStock, deleteStock, notify } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StockItem | null>(null)

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return stock.filter((item) => {
      if (filter !== 'all' && item.type !== filter) return false
      if (search && !item.name.toLowerCase().includes(search)) return false
      return true
    })
  }, [stock, filter, query])

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item: StockItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold text-ink">Склад</h1>
        <p className="mt-0.5 text-xs text-muted">
          {stock.length > 0 ? `Позиций: ${stock.length}` : 'Пока пусто'} · цены вводятся прямо с чека
        </p>
      </header>

      <Segmented value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
      <SearchInput value={query} onChange={setQuery} placeholder="Поиск по складу" />

      {visible.length === 0 ? (
        <EmptyState
          icon={query ? <SearchX size={24} /> : <Package size={24} />}
          title={query ? 'Ничего не найдено' : 'Склад пуст'}
          description={
            query
              ? 'Попробуйте другое название или сбросьте фильтр.'
              : 'Добавьте продукты, упаковку и накладные расходы.'
          }
          action={
            !query ? (
              <button
                type="button"
                onClick={openNew}
                className="tap-none flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
              >
                <Plus size={16} /> Добавить позицию
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="tap-none w-full rounded-card border border-line bg-surface px-4 py-3 text-left shadow-card transition-colors hover:bg-surface-2/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-medium text-ink">{item.name}</span>
                      <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        {TYPE_LABEL[item.type]}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{packCaption(item)}</p>
                    <p className="mt-0.5 text-[11px] text-muted/80">обновлено {formatDate(item.updatedAt)}</p>
                  </div>
                  <span className="shrink-0 text-right text-sm font-semibold text-accent">
                    {priceCaption(item)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab label="Добавить позицию склада" onClick={openNew}>
        <Plus size={20} />
        Добавить
      </Fab>

      <StockForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={async (item) => {
          await saveStock(item)
          notify(editing ? 'Позиция обновлена' : 'Позиция добавлена', 'success')
        }}
        onDelete={async (id) => {
          await deleteStock(id)
          notify('Позиция удалена', 'success')
        }}
      />
    </div>
  )
}
