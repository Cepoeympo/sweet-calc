import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/**
 * Генерация PNG-иконок PWA из исходного SVG.
 * Запуск: npm run icons
 * Результат в public/icons: pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
 * maskable-icon-512x512.png, apple-touch-icon-180x180.png, favicon.ico
 */
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.28,
      resizeOptions: { background: '#c85a72' },
    },
    apple: {
      sizes: [180],
      padding: 0.28,
      resizeOptions: { background: '#faf8f5' },
    },
  },
  images: ['public/icons/source.svg'],
})
