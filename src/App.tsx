import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { BottomNav, type TabId } from '@/components/BottomNav'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { CalculatorTab } from '@/features/calculator/CalculatorTab'
import { ProductsTab } from '@/features/products/ProductsTab'
import { SettingsTab } from '@/features/settings/SettingsTab'
import { StockTab } from '@/features/stock/StockTab'
import { useApp } from '@/store/useApp'

function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-muted">
      <Loader2 size={28} className="animate-spin text-accent" />
      <p className="text-sm">Загружаем локальную базу…</p>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      <AlertTriangle size={32} className="text-danger" />
      <p className="text-base font-semibold text-ink">Не удалось открыть приложение</p>
      <p className="text-sm text-muted">{message}</p>
      <p className="text-xs text-muted">
        Проверьте, что браузер разрешает локальное хранилище (режим инкогнито может блокировать
        IndexedDB).
      </p>
    </div>
  )
}

export default function App() {
  const { ready, error } = useApp()
  const [tab, setTab] = useState<TabId>('calculator')

  if (!ready) return <SplashScreen />
  if (error) return <ErrorScreen message={error} />

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-bg">
      <main className="flex-1 px-4 pb-[calc(92px_+_env(safe-area-inset-bottom,0px))] pt-4">
        {tab === 'calculator' ? <CalculatorTab /> : null}
        {tab === 'products' ? <ProductsTab /> : null}
        {tab === 'stock' ? <StockTab /> : null}
        {tab === 'settings' ? <SettingsTab /> : null}
      </main>

      <BottomNav value={tab} onChange={setTab} />
      <UpdatePrompt />
    </div>
  )
}
