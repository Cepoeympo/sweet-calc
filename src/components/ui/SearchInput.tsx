import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск',
  className,
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-field border border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить поиск"
          className="tap-none absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  )
}
