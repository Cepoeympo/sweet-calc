import type { Area } from 'react-easy-crop'

/** Размер фотографии рецепта после обработки (квадрат). */
export const PHOTO_SIZE = 512
/** Качество сжатия WebP/JPEG. */
export const PHOTO_QUALITY = 0.85

/** Чтение выбранного файла в DataURL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Не удалось открыть изображение'))
    image.src = src
  })
}

/** WebP с фоллбэком в JPEG для браузеров без поддержки (например, старый Safari). */
function encodeCanvas(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL('image/webp', PHOTO_QUALITY)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', PHOTO_QUALITY)
}

/**
 * Кроп области 1:1 и сжатие в квадрат 512×512.
 * crop — область в координатах исходного изображения (как в react-easy-crop).
 */
export async function cropToSquareDataUrl(imageSrc: string, crop: Area): Promise<string> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_SIZE
  canvas.height = PHOTO_SIZE

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Браузер не поддерживает Canvas')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    Math.round(crop.x),
    Math.round(crop.y),
    Math.round(crop.width),
    Math.round(crop.height),
    0,
    0,
    PHOTO_SIZE,
    PHOTO_SIZE,
  )

  return encodeCanvas(canvas)
}

/** Приблизительный размер DataURL в килобайтах — для подсказки в интерфейсе. */
export function estimateDataUrlSizeKb(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4 / 1024)
}
