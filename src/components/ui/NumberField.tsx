import { type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Значение в виде строки: пустая строка допустима */
  value: string
  onChange: (value: string) => void
  suffix?: string
}

/**
 * Числовое поле с inputmode="decimal" (мобильная цифровая клавиатура),
 * поддержкой запятой и необязательным суффиксом единицы измерения.
 */
export function NumberField({ value, onChange, suffix, className, ...rest }: NumberFieldProps) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          // разрешаем только цифры, запятую, точку и минус
          if (/^-?[0-9]*[.,]?[0-9]*$/.test(next) || next === '') onChange(next)
        }}
        className={cn(
          'w-full rounded-field border border-line bg-surface px-3 py-2.5 text-base text-ink',
          'placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
          suffix && 'pr-12',
          className,
        )}
        {...rest}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}
