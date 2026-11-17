import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, Plus, X } from 'lucide-react'
import { RecipeImage } from '@/components/RecipeImage'
import { StockPicker } from '@/components/StockPicker'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { NumberField } from '@/components/ui/NumberField'
import { NutritionInline } from '@/components/NutritionBlocks'
import { DEFAULT_PLACEHOLDER_ID } from '@/data/placeholders'
import { uid } from '@/db/repo'
import { CropModal } from '@/features/products/CropModal'
import { PlaceholderPicker } from '@/features/products/PlaceholderPicker'
import { calculateRecipeCost, stockUnitLabel, unitPrice } from '@/lib/calc'
import { formatMoney, formatWeight, parseDecimal, toInputValue } from '@/lib/format'
import { readFileAsDataUrl } from '@/lib/image'
import { calculateNutritionPer100g } from '@/lib/nutrition'
import { useApp } from '@/store/useApp'
import type { Recipe, RecipeImage as RecipeImageData, RecipeIngredient } from '@/types'

interface FormState {
  name: string
  image: RecipeImageData
  items: RecipeIngredient[]
  finalWeight: string
  finalPieces: string
  notes: string
}

function emptyForm(): FormState {
  return {
    name: '',
    image: { kind: 'preset', presetId: DEFAULT_PLACEHOLDER_ID },
    items: [],
    finalWeight: '',
    finalPieces: '',
    notes: '',
  }
}

function formFromRecipe(recipe: Recipe): FormState {
  return {
    name: recipe.name,
    image: recipe.image,
    items: recipe.items.map((item) => ({ ...item })),
    finalWeight: toInputValue(recipe.finalWeight),
    finalPieces: recipe.finalPieces ? toInputValue(recipe.finalPieces) : '',
    notes: recipe.notes ?? '',
  }
}

export function RecipeForm({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean
  initial: Recipe | null
  onClose: () => void
  onSubmit: (recipe: Recipe) => Promise<void>
}) {
  const { stock, stockMap, notify } = useApp()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [placeholderOpen, setPlaceholderOpen] = useState(false)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setForm(initial ? formFromRecipe(initial) : emptyForm())
    setError(null)
  }, [open, initial])

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const previewRecipe = useMemo<Recipe>(() => {
    const finalPieces = parseDecimal(form.finalPieces)
    return {
      id: initial?.id ?? 'preview',
      name: form.name,
      image: form.image,
      items: form.items,
      finalWeight: parseDecimal(form.finalWeight),
      finalPieces: finalPieces > 0 ? finalPieces : undefined,
      notes: form.notes,
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
  }, [form, initial])

  const cost = useMemo(() => calculateRecipeCost(previewRecipe, stockMap), [previewRecipe, stockMap])
  const nutrition = useMemo(
    () => calculateNutritionPer100g(previewRecipe, stockMap),
    [previewRecipe, stockMap],
  )

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropSource(dataUrl)
    } catch {
      notify('Не удалось прочитать фотографию', 'error')
    }
  }

  const updateAmount = (stockItemId: string, raw: string) => {
    const amount = parseDecimal(raw)
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.stockItemId === stockItemId ? { ...item, amount } : item,
      ),
    }))
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name) {
      setError('Укажите название продукции.')
      return
    }
    if (form.items.length === 0) {
      setError('Добавьте хотя бы один ингредиент из склада.')
      return
    }
    if (!(previewRecipe.finalWeight > 0)) {
      setError('Укажите фактический вес готовой партии в граммах.')
      return
    }

    setSaving(true)
    try {
      const now = Date.now()
      const recipe: Recipe = {
        ...previewRecipe,
        id: initial?.id ?? uid('recipe'),
        name,
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      }
      await onSubmit(recipe)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить рецепт.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initial ? 'Редактировать техкарту' : 'Новая техкарта'}
        size="lg"
        footer={
          <div className="flex gap-2">
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
          <div className="flex gap-3">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-field bg-surface-2">
              <RecipeImage image={form.image} alt="Фото продукции" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="justify-start"
              >
                <Camera size={16} /> Загрузить фото
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlaceholderOpen(true)}
                className="justify-start"
              >
                <ImagePlus size={16} /> Выбрать заглушку
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <p className="text-[11px] leading-tight text-muted">
                Фото обрезается в квадрат 512×512 и сжимается автоматически.
              </p>
            </div>
          </div>

          <Field label="Название продукции" htmlFor="recipe-name" error={error ?? undefined}>
            <Input
              id="recipe-name"
              value={form.name}
              placeholder="Например, зефир яблочный"
              onChange={(event) => patch('name', event.target.value)}
            />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Состав партии</span>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="tap-none flex items-center gap-1 text-sm font-medium text-accent"
              >
                <Plus size={16} /> Добавить
              </button>
            </div>

            {form.items.length === 0 ? (
              <p className="rounded-field border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                Ингредиенты ещё не добавлены. Выберите позиции со склада.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {form.items.map((ingredient) => {
                  const item = stockMap.get(ingredient.stockItemId)
                  const costValue = unitPrice(item) * ingredient.amount
                  return (
                    <li
                      key={ingredient.stockItemId}
                      className="flex items-center gap-2 rounded-field bg-surface-2 px-2.5 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {item?.name ?? 'Удалённая позиция'}
                        </p>
                        <p className="text-[11px] text-muted">{formatMoney(costValue)}</p>
                      </div>
                      <div className="w-24">
                        <NumberField
                          value={toInputValue(ingredient.amount)}
                          onChange={(value) => updateAmount(ingredient.stockItemId, value)}
                          suffix={item ? stockUnitLabel(item) : 'г'}
                          aria-label={`Количество ${item?.name ?? ''}`}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Убрать ${item?.name ?? 'ингредиент'}`}
                        onClick={() =>
                          patch(
                            'items',
                            form.items.filter((entry) => entry.stockItemId !== ingredient.stockItemId),
                          )
                        }
                        className="tap-none flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Вес готового продукта" htmlFor="recipe-weight" hint="Обязательное поле">
              <NumberField
                id="recipe-weight"
                value={form.finalWeight}
                onChange={(value) => patch('finalWeight', value)}
                suffix="г"
                placeholder="0"
              />
            </Field>
            <Field label="Количество штук" htmlFor="recipe-pieces" hint="Необязательно">
              <NumberField
                id="recipe-pieces"
                value={form.finalPieces}
                onChange={(value) => patch('finalPieces', value)}
                suffix="шт"
                placeholder="—"
              />
            </Field>
          </div>

          <Field label="Заметки к техкарте" htmlFor="recipe-notes">
            <Textarea
              id="recipe-notes"
              value={form.notes}
              onChange={(event) => patch('notes', event.target.value)}
              placeholder="Температура уваривания сиропа, время взбивания, условия сушки…"
              rows={4}
            />
          </Field>

          <div className="rounded-card bg-surface-2 p-3">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-muted">Себестоимость партии</p>
              <p className="text-sm font-semibold text-ink">{formatMoney(cost.batchCost)}</p>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xs text-muted">
                За 100 г{previewRecipe.finalWeight > 0 ? ` · партия ${formatWeight(previewRecipe.finalWeight)}` : ''}
              </p>
              <p className="text-sm font-semibold text-accent">{formatMoney(cost.costPerGram * 100)}</p>
            </div>
            {cost.costPerPiece !== null ? (
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-xs text-muted">За 1 шт</p>
                <p className="text-sm font-semibold text-accent">{formatMoney(cost.costPerPiece)}</p>
              </div>
            ) : null}
            <div className="mt-2 border-t border-line pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">КБЖУ на 100 г</p>
                <NutritionInline totals={nutrition} />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <StockPicker
        open={pickerOpen}
        items={stock}
        allowedTypes={['food', 'unit']}
        excludeIds={form.items.map((item) => item.stockItemId)}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) =>
          patch('items', [
            ...form.items,
            { stockItemId: item.id, amount: item.type === 'unit' ? 1 : 0 },
          ])
        }
      />

      <PlaceholderPicker
        open={placeholderOpen}
        value={form.image.kind === 'preset' ? form.image.presetId : ''}
        onSelect={(presetId) => patch('image', { kind: 'preset', presetId })}
        onClose={() => setPlaceholderOpen(false)}
      />

      <CropModal
        open={cropSource !== null}
        imageSrc={cropSource ?? ''}
        onCancel={() => setCropSource(null)}
        onDone={(dataUrl) => {
          patch('image', { kind: 'custom', dataUrl })
          setCropSource(null)
        }}
      />
    </>
  )
}
