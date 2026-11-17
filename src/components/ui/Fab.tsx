import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Плавающая кнопка над нижней навигацией.
 * На широком экране выравнивается по правому краю центрированного контейнера (768px).
 */
export function Fab({
  children,
  className,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'tap-none fixed bottom-[calc(84px_+_env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-fg shadow-float transition-transform active:scale-95',
        'sm:right-[calc(50%_-_384px_+_16px)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
