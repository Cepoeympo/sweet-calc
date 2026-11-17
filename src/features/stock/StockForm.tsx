import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { NumberField } from '@/components/ui/NumberField'
import { Segmented } from '@/components/ui/Segmented'
import { NUTRITION_GROUP_LABELS, searchNutritionPresets, type NutritionPreset } from '@/data/nutritionPresets'
import { uid } from '@/db/repo'
import { unitPrice, unitPricePer100 } from '@/lib/calc'
import { formatMoney, parseDecimal, toInputValue } from '@/lib/format'
import type { StockItem, StockType } from '@/types'

interface FormState {
  type: StockType
  name: string
  packAmount: string
  packPrice: string
  overheadMode: 'fixed' | 'percent'
  proteins: string
  fats: string
  carbs: string
  kcal: string
}

function emptyForm(): FormState {
  return {
    type: 'food',
    name: '',
    packAmount: '',
    packPrice: '',
    overheadMode: 'fixed',
    proteins: '',
    fats: '',
    carbs: '',
    kcal: '',
  }
}

function formFromItem(item: StockItem): FormState {
  return {
    type: item.type,
    name: item.name,
    packAmount: toInputValue(item.packAmount),
    packPrice: toInputValue(item.packPrice),
    overheadMode: item.overheadMode ?? 'fixed',
    proteins: toInputValue(item.nutrition?.proteins),
    fats: toInputValue(item.nutrition?.fats),
    carbs: toInputValue(item.nutrition?.carbs),
    kcal: toInputValue(item.nutrition?.kcal),
  }
}

const TYPE_OPTIONS: { value: StockType; label: string }[] = [
  { value: 'food', label: 'Продукт (г)' },
  { value: 'unit', label: 'Упаковка (шт)' },
  { value: 'overhead', label: 'Накладные' },
]

export function StockForm({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean
  initial: StockItem | null
  onClose: () => void
  onSubmit: (item: StockItem) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const [nameFocused, setNameFocused] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initial ? formFromItem(initial) : emptyForm())
    setError(null)
    setNameFocused(false)
  }, [open, initial])

  const suggestions = useMemo<NutritionPreset[]>(() => {
    if (form.type !== 'food' || !nameFocused) return []
    return searchNutritionPresets(form.name, 5)
  }, [form.name, form.type, nameFocused])

  const applySuggestion = (preset: NutritionPreset) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      proteins: toInputValue(preset.proteins),
      fats: toInputValue(preset.fats),
      carbs: toInputValue(preset.carbs),
      kcal: toInputValue(preset.kcal),
    }))
    setNameFocused(false)
  }

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const preview = useMemo<StockItem>(() => {
    const nutrition = {
      proteins: form.proteins ? parseDecimal(form.proteins) : undefined,
      fats: form.fats ? parseDecimal(form.fats) : undefined,
      carbs: form.carbs ? parseDecimal(form.carbs) : undefined,
      kcal: form.kcal ? parseDecimal(form.kcal) : undefined,
    }
    const hasNutrition =
      nutrition.proteins !== undefined ||
      nutrition.fats !== undefined ||
      nutrition.carbs !== undefined ||
      nutrition.kcal !== undefined

    return {
      id: initial?.id ?? 'preview',
      type: form.type,
      name: form.name,
      packAmount: parseDecimal(form.packAmount) || (form.type === 'overhead' ? 1 : 0),
      packPrice: parseDecimal(form.packPrice),
      overheadMode: form.type === 'overhead' ? form.overheadMode : undefined,
      nutrition: form.type === 'food' && hasNutrition ? nutrition : undefined,
      updatedAt: initial?.updatedAt ?? Date.now(),
      createdAt: initial?.createdAt ?? Date.now(),
    }
  }, [form, initial])

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setError('Укажите название позиции.')
      return
    }

    const packAmount = preview.packAmount
    if (form.type !== 'overhead' && !(packAmount > 0)) {
      setError(form.type === 'food' ? 'Укажите вес упаковки в граммах.' : 'Укажите количество в пачке.')
      return
    }

    if (!(preview.packPrice >= 0)) {
      setError('Цена не может быть отрицательной.')
      return
    }

    setSaving(true)
    try {
      const now = Date.now()
      const item: StockItem = {
        ...preview,
        id: initial?.id ?? uid('stock'),
        name,
        updatedAt: now,
        createdAt: initial?.createdAt ?? now,
      }
      await onSubmit(item)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить позицию.')
    } finally {
      setSaving(false)
    }
  }

  const priceLabel =
    form.type === 'overhead'
      ? form.overheadMode === 'percent'
        ? 'Процент от себестоимости, %'
        : 'Сумма расхода, ₽'
      : 'Цена упаковки, ₽'

  const amountLabel = form.type === 'food' ? 'Вес упаковки, г' : 'Количество в пачке, шт'

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initial ? 'Изменить позицию' : 'Новая позиция склада'}
        footer={
          <div className="flex gap-2">
            {initial ? (
              <Button variant="danger" size="md" onClick={() => setConfirmDelete(true)} aria-label="Удалить">
                <Trash2 size={18} />
              </Button>
            ) : null}
            <Button variant="secondary" fullWidth onClick={onClose}>
              Отмена
            </Button>
            <Button fullWidth onClick={() => void handleSave()} disabled={saving}>
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Segmented
            value={form.type}
            onChange={(value) => patch('type', value)}
            options={TYPE_OPTIONS}
            size="sm"
          />

          <Field label="Название" htmlFor="stock-name" error={error ?? undefined}>
            <Input
              id="stock-name"
              ref={nameRef}
              value={form.name}
              autoComplete="off"
              placeholder={form.type === 'food' ? 'Например, сахар-песок' : 'Например, коробка на 9 шт'}
              onChange={(event) => patch('name', event.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => window.setTimeout(() => setNameFocused(false), 150)}
            />
          </Field>

          {suggestions.length > 0 ? (
            <div className="-mt-2 overflow-hidden rounded-field border border-line bg-surface shadow-card">
              <p className="border-b border-line px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">
                Подсказки КБЖУ из справочника
              </p>
              <ul>
                {suggestions.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySuggestion(preset)}
                      className="tap-none flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-2"
                    >
                      <span className="text-sm text-ink">
                        {preset.name}
                        <span className="ml-1 text-[11px] text-muted">
                          {NUTRITION_GROUP_LABELS[preset.group]}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{preset.kcal} ккал</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {form.type !== 'overhead' ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label={amountLabel} htmlFor="stock-amount">
                <NumberField
                  id="stock-amount"
                  value={form.packAmount}
                  onChange={(value) => patch('packAmount', value)}
                  suffix={form.type === 'food' ? 'г' : 'шт'}
                  placeholder="0"
                />
              </Field>
              <Field label={priceLabel} htmlFor="stock-price">
                <NumberField
                  id="stock-price"
                  value={form.packPrice}
                  onChange={(value) => patch('packPrice', value)}
                  suffix="₽"
                  placeholder="0"
                />
              </Field>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Segmented
                value={form.overheadMode}
                onChange={(value) => patch('overheadMode', value)}
                options={[
                  { value: 'fixed', label: 'Фикс. сумма' },
                  { value: 'percent', label: 'Процент' },
                ]}
                size="sm"
              />
              <Field label={priceLabel} htmlFor="stock-overhead">
                <NumberField
                  id="stock-overhead"
                  value={form.packPrice}
                  onChange={(value) => patch('packPrice', value)}
                  suffix={form.overheadMode === 'percent' ? '%' : '₽'}
                  placeholder="0"
                />
              </Field>
            </div>
          )}

          {form.type === 'food' ? (
            <div className="rounded-card bg-surface-2 p-3">
              <p className="mb-2 text-xs font-medium text-ink">КБЖУ на 100 г</p>
              <div className="grid grid-cols-4 gap-2">
                <Field label="Белки">
                  <NumberField value={form.proteins} onChange={(value) => patch('proteins', value)} placeholder="—" />
                </Field>
                <Field label="Жиры">
                  <NumberField value={form.fats} onChange={(value) => patch('fats', value)} placeholder="—" />
                </Field>
                <Field label="Углев.">
                  <NumberField value={form.carbs} onChange={(value) => patch('carbs', value)} placeholder="—" />
                </Field>
                <Field label="Ккал">
                  <NumberField value={form.kcal} onChange={(value) => patch('kcal', value)} placeholder="—" />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Поля можно оставить пустыми — в расчётах они считаются нулём.
              </p>
            </div>
          ) : null}

          <div className="rounded-field border border-line px-3 py-2.5 text-sm">
            <span className="text-muted">Цена единицы: </span>
            <span className="font-semibold text-ink">
              {form.type === 'food'
                ? `${formatMoney(unitPricePer100(preview))} / 100 г`
                : form.type === 'unit'
                  ? `${formatMoney(unitPrice(preview))} / шт`
                  : form.overheadMode === 'percent'
                    ? `${formatDecimal(preview.packPrice)}% от себестоимости`
                    : formatMoney(preview.packPrice)}
            </span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Удалить позицию?"
        description="Позиция исчезнет из склада. Рецепты, где она использовалась, потребуют замены ингредиента."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (initial) void onDelete(initial.id)
          setConfirmDelete(false)
          onClose()
        }}
      />
    </>
  )
}

function formatDecimal(value: number): string {
  return toInputValue(value) || '0'
}
