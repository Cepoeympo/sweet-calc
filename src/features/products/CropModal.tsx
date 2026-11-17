import { useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Slider } from '@/components/ui/Slider'
import { cropToSquareDataUrl, PHOTO_SIZE } from '@/lib/image'

/**
 * Квадратное кадрирование фотографии 1:1 с последующим сжатием
 * в 512×512 WebP. Поддерживает перетаскивание мышью и pinch-жесты.
 */
export function CropModal({
  open,
  imageSrc,
  onCancel,
  onDone,
}: {
  open: boolean
  imageSrc: string
  onCancel: () => void
  onDone: (dataUrl: string) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setArea(null)
    setBusy(false)
    setError(null)
  }, [open, imageSrc])

  const handleConfirm = async () => {
    if (!area) {
      setError('Выберите область фотографии.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await cropToSquareDataUrl(imageSrc, area)
      onDone(dataUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось обработать фотографию.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Кадрирование фотографии"
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={busy}>
            Отмена
          </Button>
          <Button fullWidth onClick={() => void handleConfirm()} disabled={busy}>
            {busy ? 'Обработка…' : 'Готово'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="relative h-[320px] w-full overflow-hidden rounded-card bg-black">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_croppedArea, croppedAreaPixels) => setArea(croppedAreaPixels)}
            />
          ) : null}
        </div>

        <Slider
          label="Масштаб"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={setZoom}
        />

        <p className="text-xs text-muted">
          Перетащите фото и подберите масштаб. Итог сохраняется как квадрат {PHOTO_SIZE}×{PHOTO_SIZE} px
          в WebP (при необходимости — JPEG).
        </p>

        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </Modal>
  )
}
