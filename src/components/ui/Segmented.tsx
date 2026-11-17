import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar flex w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'tap-none flex-1 whitespace-nowrap rounded-full px-3 font-medium transition-colors',
              size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
              active ? 'bg-accent text-accent-fg shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
