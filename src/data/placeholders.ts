import type { RecipeImage } from '@/types'

/** Встроенная векторная заглушка рецепта. */
export interface PlaceholderPreset {
  id: string
  title: string
  /** Имя файла в public/placeholders */
  file: string
  /** Преобладающий цвет — используется как подложка при загрузке */
  tone: string
}

/**
 * 8 стандартных заглушек. Чтобы добавить свою — положите SVG 512×512
 * в public/placeholders и добавьте строку в этот массив.
 */
export const PLACEHOLDERS: PlaceholderPreset[] = [
  { id: 'marshmallow-swirl', title: 'Зефир-завиток', file: 'marshmallow-swirl.svg', tone: '#e9b9c6' },
  { id: 'marshmallow-flowers', title: 'Зефирные цветы', file: 'marshmallow-flowers.svg', tone: '#eec3bb' },
  { id: 'marmalade-cubes', title: 'Мармеладные кубики', file: 'marmalade-cubes.svg', tone: '#f3c98d' },
  { id: 'pastila', title: 'Пастила / рулетики', file: 'pastila.svg', tone: '#eab3a1' },
  { id: 'meringue', title: 'Безе / меренга', file: 'meringue.svg', tone: '#f2d3ae' },
  { id: 'bird-milk', title: 'Птичье молоко / суфле', file: 'bird-milk.svg', tone: '#dfb28a' },
  { id: 'truffles', title: 'Шоколад / трюфели', file: 'truffles.svg', tone: '#c9a189' },
  { id: 'gift-set', title: 'Подарочный набор', file: 'gift-set.svg', tone: '#bcd3bd' },
]

export const DEFAULT_PLACEHOLDER_ID = 'marshmallow-swirl'

export function findPlaceholder(id: string | undefined): PlaceholderPreset {
  return PLACEHOLDERS.find((item) => item.id === id) ?? PLACEHOLDERS[0]
}

/** URL заглушки с учётом base-пути GitHub Pages. */
export function placeholderUrl(id: string | undefined): string {
  const preset = findPlaceholder(id)
  return `${import.meta.env.BASE_URL}placeholders/${preset.file}`
}

/** Итоговый src для картинки рецепта. */
export function resolveRecipeImage(image: RecipeImage | undefined): string {
  if (!image) return placeholderUrl(DEFAULT_PLACEHOLDER_ID)
  if (image.kind === 'custom') return image.dataUrl
  return placeholderUrl(image.presetId)
}
