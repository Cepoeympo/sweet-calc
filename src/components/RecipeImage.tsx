import { resolveRecipeImage } from '@/data/placeholders'
import { cn } from '@/lib/cn'
import type { RecipeImage as RecipeImageData } from '@/types'

export function RecipeImage({
  image,
  alt,
  className,
}: {
  image: RecipeImageData | undefined
  alt: string
  className?: string
}) {
  return (
    <img
      src={resolveRecipeImage(image)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full bg-surface-2 object-cover', className)}
    />
  )
}
