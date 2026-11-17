import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  valueLabel,
  className,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: string
  valueLabel?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label || valueLabel ? (
        <div className="flex items-center justify-between gap-2">
          {label ? <span className="text-sm font-medium text-ink">{label}</span> : <span />}
          {valueLabel ? <span className="text-sm font-semibold text-accent">{valueLabel}</span> : null}
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
      />
    </div>
  )
}
