import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
