import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const controlClass =
  'w-full rounded-field border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60'

export function Field({
  label,
  hint,
  error,
  htmlFor,
  right,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  htmlFor?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label || right ? (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
              {label}
            </label>
          ) : null}
          {right}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlClass, 'resize-y', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, 'appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
    )
  },
)
