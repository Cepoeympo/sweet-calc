import { Modal } from '@/components/ui/Modal'
import { CHANGELOG } from '@/data/changelog'

export function ChangelogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="История изменений" size="lg">
      <ol className="flex flex-col gap-4">
        {CHANGELOG.map((entry) => (
          <li key={entry.version} className="border-b border-line pb-4 last:border-none last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Версия {entry.version}</h3>
              <span className="text-xs text-muted">{entry.date}</span>
            </div>

            {entry.added && entry.added.length > 0 ? (
              <div className="mt-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-accent">Добавлено</p>
                <ul className="mt-1 list-disc pl-4 text-xs leading-relaxed text-muted">
                  {entry.added.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {entry.changed && entry.changed.length > 0 ? (
              <div className="mt-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-accent">Изменено</p>
                <ul className="mt-1 list-disc pl-4 text-xs leading-relaxed text-muted">
                  {entry.changed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {entry.fixed && entry.fixed.length > 0 ? (
              <div className="mt-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-accent">Исправлено</p>
                <ul className="mt-1 list-disc pl-4 text-xs leading-relaxed text-muted">
                  {entry.fixed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </Modal>
  )
}
