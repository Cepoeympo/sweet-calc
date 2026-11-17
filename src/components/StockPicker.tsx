import { useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { Segmented } from '@/components/ui/Segmented'
import { unitPrice, unitPricePer100, stockUnitLabel } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import type { StockItem, StockType } from '@/types'

type Filter = 'all' | StockType

export function StockPicker({
  open,
  title = 'Выберите позицию склада',
  items,
  allowedTypes = ['food', 'unit', 'overhead'],
  excludeIds = [],
  onSelect,
  onClose,
}: {
  open: boolean
  title?: string
  items: StockItem[]
  allowedTypes?: StockType[]
  excludeIds?: string[]
  onSelect: (item: StockItem) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    const excluded = new Set(excludeIds)
    return items.filter((item) => {
      if (!allowedTypes.includes(item.type)) return false
      if (excluded.has(item.id)) return false
      if (filter !== 'all' && item.type !== filter) return false
      if (search && !item.name.toLowerCase().includes(search)) return false
      return true
    })
  }, [items, allowedTypes, excludeIds, filter, query])

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Название продукта или упаковки" />
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'food', label: 'Продукты' },
            { value: 'unit', label: 'Упаковка' },
            { value: 'overhead', label: 'Накладные' },
          ]}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="Ничего не найдено"
            description="Добавьте позицию на вкладке «Склад»."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                  className="tap-none flex w-full items-center justify-between gap-3 py-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-ink">{item.name}</span>
                    <span className="block text-xs text-muted">
                      {formatMoney(item.packPrice)} за {item.packAmount} {stockUnitLabel(item)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent">
                    {item.type === 'overhead'
                      ? item.overheadMode === 'percent'
                        ? `${item.packPrice}%`
                        : formatMoney(item.packPrice)
                      : item.type === 'food'
                        ? `${formatMoney(unitPricePer100(item))} / 100 г`
                        : `${formatMoney(unitPrice(item))} / шт`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
