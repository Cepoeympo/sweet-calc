import { Calculator, Cake, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

export type TabId = 'calculator' | 'products' | 'stock' | 'settings'

export const TABS: { id: TabId; label: string; icon: typeof Calculator }[] = [
  { id: 'calculator', label: 'Калькулятор', icon: Calculator },
  { id: 'products', label: 'Продукция', icon: Cake },
  { id: 'stock', label: 'Склад', icon: Package },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

export function BottomNav({ value, onChange }: { value: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-app items-stretch justify-between px-2 pt-1.5 pb-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'tap-none flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors',
                active ? 'text-accent' : 'text-muted hover:text-ink',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                  active && 'bg-accent-soft',
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
              </span>
              <span className={cn('text-[11px] leading-none', active ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
