import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      manifest: {
        name:             'ChurchTrakr',
        short_name:       'ChurchTrakr',
        description:      'Church attendance and member management for pastors and ministry leaders',
        start_url:        '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#1a3a2a',
        theme_color:      '#1a3a2a',
        lang:             'en-NG',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['productivity', 'utilities'],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],

  server: {
    proxy: {
      '/termii-api': {
        target: 'https://v3.api.termii.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/termii-api/, ''),
        secure: true,
      },
    },
  },
})