import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import {
  applyBackup,
  exportBackupToFile,
  parseBackupJson,
  type BackupFile,
  type ImportMode,
} from '@/lib/backup'
import { formatDateTime } from '@/lib/format'
import { useApp } from '@/store/useApp'

export function BackupSection() {
  const { notify, reload } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    try {
      const name = await exportBackupToFile()
      notify(`Файл ${name} сохранён`, 'success')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось создать резервную копию', 'error')
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupJson(text)
      setMode('merge')
      setPending(backup)
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось прочитать файл', 'error')
    }
  }

  const handleApply = async () => {
    if (!pending) return
    setBusy(true)
    try {
      const summary = await applyBackup(pending, mode)
      await reload()
      notify(
        mode === 'replace'
          ? 'База заменена данными из файла'
          : `Добавлено: позиций ${summary.stockAdded}, рецептов ${summary.recipesAdded}`,
        'success',
      )
      setPending(null)
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось применить резервную копию', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" onClick={() => void handleExport()}>
        <Download size={17} /> Экспортировать базу (.json)
      </Button>
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload size={17} /> Импортировать базу (.json)
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <p className="text-[11px] leading-relaxed text-muted">
        В файл попадают склад, рецепты со сжатыми фотографиями и настройки. Токен GitHub Gist
        в резервную копию не включается.
      </p>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Импорт резервной копии"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setPending(null)}>
              Отмена
            </Button>
            <Button fullWidth disabled={busy} onClick={() => void handleApply()}>
              Импортировать
            </Button>
          </div>
        }
      >
        {pending ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink">
              В файле: <span className="font-semibold">{pending.stock.length}</span> позиций склада и{' '}
              <span className="font-semibold">{pending.recipes.length}</span> рецептов.
            </p>
            <p className="text-xs text-muted">Файл создан {formatDateTime(Date.parse(pending.exportedAt))}</p>

            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'merge', label: 'Добавить недостающие' },
                { value: 'replace', label: 'Заменить текущую базу' },
              ]}
              size="sm"
            />

            <p className="rounded-field bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
              {mode === 'replace'
                ? 'Текущие склад и рецепты будут полностью удалены и заменены данными из файла.'
                : 'Существующие позиции с теми же идентификаторами останутся без изменений.'}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
