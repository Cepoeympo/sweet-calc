import { useEffect, useState } from 'react'
import { Check, FlaskConical, Package, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Select } from '@/components/ui/Field'
import { NumberField } from '@/components/ui/NumberField'
import { Segmented } from '@/components/ui/Segmented'
import { ACCENT_PALETTES } from '@/data/accents'
import { VERSION_LABEL } from '@/data/changelog'
import { ROUNDING_OPTIONS } from '@/data/defaults'
import { BackupSection } from '@/features/settings/BackupSection'
import { ChangelogModal } from '@/features/settings/ChangelogModal'
import { GistSection } from '@/features/settings/GistSection'
import { cn } from '@/lib/cn'
import { parseDecimal, toInputValue } from '@/lib/format'
import { useApp } from '@/store/useApp'
import type { RoundingStep, ThemeMode } from '@/types'

const MARKUP_PRESETS = [100, 150, 200, 250]

export function SettingsTab() {
  const { settings, updateSettings, restorePackaging, loadDemoRecipe, notify } = useApp()
  const [markupText, setMarkupText] = useState(toInputValue(settings.markupPercent))
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMarkupText(toInputValue(settings.markupPercent))
  }, [settings.markupPercent])

  const commitMarkup = async () => {
    const value = Math.max(0, Math.min(2000, parseDecimal(markupText)))
    setMarkupText(toInputValue(value))
    if (value !== settings.markupPercent) {
      await updateSettings({ markupPercent: value })
      notify('Наценка по умолчанию обновлена', 'success')
    }
  }

  const handleRestorePackaging = async () => {
    setBusy(true)
    try {
      await restorePackaging()
    } finally {
      setBusy(false)
    }
  }

  const handleDemo = async () => {
    setConfirmDemo(false)
    setBusy(true)
    try {
      await loadDemoRecipe()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Не удалось загрузить демо-рецепт', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <header>
        <h1 className="text-xl font-semibold text-ink">Настройки</h1>
        <p className="mt-0.5 text-xs text-muted">Внешний вид, цены и резервные копии</p>
      </header>

      {/* Внешний вид */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={16} className="text-accent" /> Внешний вид
        </h2>

        <p className="mb-1.5 text-xs text-muted">Тема оформления</p>
        <Segmented
          value={settings.theme}
          onChange={(theme: ThemeMode) => void updateSettings({ theme })}
          options={[
            { value: 'system', label: 'Системная' },
            { value: 'light', label: 'Светлая' },
            { value: 'dark', label: 'Тёмная' },
          ]}
          size="sm"
        />

        <p className="mb-2 mt-4 text-xs text-muted">Акцентный цвет</p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {ACCENT_PALETTES.map((palette) => {
            const active = palette.id === settings.accentId
            return (
              <button
                key={palette.id}
                type="button"
                title={palette.title}
                aria-label={palette.title}
                aria-pressed={active}
                onClick={() => void updateSettings({ accentId: palette.id })}
                style={{ backgroundColor: palette.accent }}
                className={cn(
                  'tap-none flex aspect-square w-full items-center justify-center rounded-full transition-transform active:scale-95',
                  active ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'opacity-90',
                )}
              >
                {active ? <Check size={18} color={palette.foreground} /> : null}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          {ACCENT_PALETTES.find((palette) => palette.id === settings.accentId)?.title ?? 'Ягодно-пудровый'}
        </p>
      </section>

      {/* Ценообразование */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">Ценообразование</h2>

        <Field label="Наценка по умолчанию" htmlFor="settings-markup">
          <div className="flex items-center gap-2">
            <NumberField
              id="settings-markup"
              value={markupText}
              onChange={setMarkupText}
              onBlur={() => void commitMarkup()}
              suffix="%"
            />
          </div>
        </Field>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {MARKUP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setMarkupText(String(preset))
                void updateSettings({ markupPercent: preset })
              }}
              className={cn(
                'tap-none shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                settings.markupPercent === preset
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-2 text-muted hover:text-ink',
              )}
            >
              {preset}%
            </button>
          ))}
        </div>

        <Field label="Шаг округления итоговой цены" htmlFor="settings-rounding" className="mt-4">
          <Select
            id="settings-rounding"
            value={String(settings.roundingStep)}
            onChange={(event) =>
              void updateSettings({ roundingStep: Number(event.target.value) as RoundingStep })
            }
          >
            {ROUNDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-1 text-[11px] text-muted">
          Цена округляется вверх, чтобы не терять прибыль.
        </p>
      </section>

      {/* Резервное копирование */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">Резервное копирование и синхронизация</h2>
        <BackupSection />
        <div className="mt-3">
          <GistSection />
        </div>
      </section>

      {/* Управление данными */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">Управление данными</h2>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => void handleRestorePackaging()} disabled={busy}>
            <Package size={17} /> Добавить упаковку и ингредиенты
          </Button>
          <Button variant="outline" onClick={() => setConfirmDemo(true)} disabled={busy}>
            <FlaskConical size={17} /> Загрузить демо-рецепт яблочного зефира
          </Button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          На склад добавятся недостающие позиции стандартной упаковки и все ингредиенты справочника
          КБЖУ с ценой 0 ₽ — цены существующих позиций не меняются.
          Демо-рецепт использует существующие ингредиенты или создаёт недостающие.
        </p>
      </section>

      <button
        type="button"
        onClick={() => setChangelogOpen(true)}
        className="tap-none mx-auto mt-2 text-center text-xs font-medium text-muted underline decoration-line underline-offset-4"
      >
        {VERSION_LABEL}
      </button>

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />

      <ConfirmDialog
        open={confirmDemo}
        title="Загрузить демо-рецепт?"
        description="В продукцию добавится техкарта «Зефир яблочный (демо)». Недостающие ингредиенты появятся на складе с ориентировочными ценами."
        confirmLabel="Загрузить"
        danger={false}
        onCancel={() => setConfirmDemo(false)}
        onConfirm={() => void handleDemo()}
      />
    </div>
  )
}
