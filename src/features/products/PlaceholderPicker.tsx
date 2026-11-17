import { PLACEHOLDERS, placeholderUrl } from '@/data/placeholders'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

export function PlaceholderPicker({
  open,
  value,
  onSelect,
  onClose,
}: {
  open: boolean
  value: string
  onSelect: (presetId: string) => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Заглушка для продукции" size="lg">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLACEHOLDERS.map((preset) => {
          const active = preset.id === value
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onSelect(preset.id)
                onClose()
              }}
              className={cn(
                'tap-none overflow-hidden rounded-field border-2 text-left transition-colors',
                active ? 'border-accent' : 'border-transparent hover:border-line',
              )}
            >
              <img
                src={placeholderUrl(preset.id)}
                alt={preset.title}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <span className="block px-1.5 py-1.5 text-[11px] leading-tight text-ink">
                {preset.title}
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
