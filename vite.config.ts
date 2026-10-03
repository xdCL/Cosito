import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_CONFIG } from './src/config/app.ts';
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'serve' && !isPreview ? '/' : process.env.COSITO_BASE || '/Cosito/',
  plugins: [
    {
      name: 'cosito-identity',
      transformIndexHtml: (html) =>
        html
          .replace('__APP_TITLE__', APP_CONFIG.title)
          .replace('__APP_DESCRIPTION__', APP_CONFIG.metaDescription),
    },
    preact(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', '*.md', 'LICENSE'],
      manifest: {
        name: APP_CONFIG.name,
        short_name: APP_CONFIG.name,
        description: APP_CONFIG.description,
        lang: 'es',
        display: 'standalone',
        theme_color: '#ff7c66',
        background_color: '#fff9f0',
        icons: [192, 512].map((size) => ({
          src: `icons/icon-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
        })),
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,md}', 'LICENSE'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
}));
