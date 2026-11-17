import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

// Проект публикуется на GitHub Pages в репозитории sweet-calc,
// поэтому все ассеты должны запрашиваться с префиксом /sweet-calc/.
const BASE = '/sweet-calc/'
const BUILD_NUMBER = process.env.VITE_BUILD_NUMBER ?? '1'

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_NUMBER__: JSON.stringify(BUILD_NUMBER),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' — приложение само решает, когда показать тост об обновлении
      registerType: 'prompt',
      includeAssets: ['icons/favicon.ico', 'icons/apple-touch-icon-180x180.png', 'placeholders/*.svg'],
      manifest: {
        name: 'Sweet Calc',
        short_name: 'Sweet Calc',
        description:
          'Расчёт себестоимости, техкарт и КБЖУ кондитерских изделий. Работает без интернета.',
        lang: 'ru',
        dir: 'ltr',
        start_url: `${BASE}`,
        scope: `${BASE}`,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FAF8F5',
        background_color: '#FAF8F5',
        categories: ['food', 'productivity', 'utilities'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/source.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
