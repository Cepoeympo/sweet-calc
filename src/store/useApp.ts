import { useContext } from 'react'
import { AppContext, type AppContextValue } from '@/store/app-context'

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp должен использоваться внутри AppProvider')
  return context
}
