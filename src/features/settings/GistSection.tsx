import { useState } from 'react'
import {
  ChevronDown,
  CloudDownload,
  CloudUpload,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input } from '@/components/ui/Field'
import { applyBackup, createBackupPayload, parseBackupJson } from '@/lib/backup'
import { formatDateTime } from '@/lib/format'
import { loadBackupFromGist, saveBackupToGist } from '@/lib/gist'
import { cn } from '@/lib/cn'
import { useApp } from '@/store/useApp'

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Sweet%20Calc'

export function GistSection() {
  const { settings, updateSettings, notify, reload } = useApp()
  const [open, setOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [token, setToken] = useState(settings.gistToken)
  const [gistId, setGistId] = useState(settings.gistId)
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)

  const persistCredentials = async (patch: { gistToken?: string; gistId?: string }) => {
    await updateSettings(patch)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await persistCredentials({ gistToken: token.trim(), gistId: gistId.trim() })
      const payload = await createBackupPayload()
      const result = await saveBackupToGist(
        { token: token.trim(), gistId: gistId.trim() },
        payload,
      )
      setGistId(result.gistId)
      await updateSettings({
        gistToken: token.trim(),
        gistId: result.gistId,
        lastSyncAt: Date.parse(result.updatedAt) || Date.now(),
      })
      notify('База сохранена в GitHub Gist', 'success')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось сохранить в Gist', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    setConfirmRestore(false)
    setRestoring(true)
    try {
      await persistCredentials({ gistToken: token.trim(), gistId: gistId.trim() })
      const content = await loadBackupFromGist({ token: token.trim(), gistId: gistId.trim() })
      const backup = parseBackupJson(content)
      await applyBackup(backup, 'replace')
      await updateSettings({ lastSyncAt: Date.now() })
      await reload()
      notify('База восстановлена из Gist', 'success')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось восстановить из Gist', 'error')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="tap-none flex items-center justify-between gap-2 rounded-field bg-surface-2 px-3 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">Облако (GitHub Gist)</span>
          <span className="block truncate text-[11px] text-muted">
            {settings.lastSyncAt
              ? `Последняя синхронизация: ${formatDateTime(settings.lastSyncAt)}`
              : 'Не синхронизировалось'}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 rounded-field border border-line p-3">
          <button
            type="button"
            onClick={() => setHelpOpen((prev) => !prev)}
            aria-expanded={helpOpen}
            className="tap-none flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
          >
            <HelpCircle size={14} />
            Как получить токен
            <ChevronDown
              size={14}
              className={cn('transition-transform', helpOpen && 'rotate-180')}
            />
          </button>

          {helpOpen ? (
            <div className="flex flex-col gap-2 rounded-field bg-surface-2 p-3 text-xs leading-relaxed text-muted">
              <p className="font-medium text-ink">Токен нужен один раз — дальше он хранится в браузере.</p>
              <ol className="flex list-decimal flex-col gap-1.5 pl-4">
                <li>
                  Откройте страницу создания токена:{' '}
                  <a
                    href={TOKEN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent underline decoration-accent/40 underline-offset-2"
                  >
                    github.com/settings/tokens/new
                    <ExternalLink size={12} />
                  </a>
                  . Ссылка уже открывает форму с отмеченным правом <b>gist</b>.
                </li>
                <li>
                  Если открываете вручную: GitHub → Settings → Developer settings →
                  Personal access tokens → <b>Tokens (classic)</b> → Generate new token.
                </li>
                <li>
                  Отметьте единственное право <b>gist</b>, задайте срок действия и нажмите
                  «Generate token».
                </li>
                <li>
                  Скопируйте токен (он показывается один раз) и вставьте его в поле ниже.
                  Поле <b>Gist ID</b> оставьте пустым — приложение создаст Gist само.
                </li>
              </ol>
              <p>
                Токен хранится только в этом браузере (IndexedDB), не попадает в код, журналы и
                файл резервной копии. Отозвать его можно на той же странице GitHub.
              </p>
            </div>
          ) : null}

          <Field
            label="Personal Access Token"
            hint="Право gist. Хранится только в этом браузере."
          >
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={token}
                autoComplete="off"
                spellCheck={false}
                placeholder="ghp_…"
                className="pr-11"
                onChange={(event) => setToken(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken((prev) => !prev)}
                aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
                className="tap-none absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Gist ID" hint="Оставьте пустым, чтобы создать новый Gist при сохранении.">
            <Input
              value={gistId}
              autoComplete="off"
              spellCheck={false}
              placeholder="например, 8f3c…"
              onChange={(event) => setGistId(event.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Button onClick={() => void handleSave()} disabled={saving || restoring}>
              <CloudUpload size={17} /> {saving ? 'Сохраняем…' : 'Сохранить в Gist'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmRestore(true)}
              disabled={saving || restoring}
            >
              <CloudDownload size={17} /> {restoring ? 'Восстанавливаем…' : 'Восстановить из Gist'}
            </Button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted">
            Восстановление заменяет текущую базу данными из Gist. Перед восстановлением
            рекомендуем сохранить локальный JSON-бэкап.
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmRestore}
        title="Восстановить базу из Gist?"
        description="Текущие склад, рецепты и фотографии будут заменены данными из облака. Действие нельзя отменить."
        confirmLabel="Восстановить"
        danger={false}
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => void handleRestore()}
      />
    </div>
  )
}
