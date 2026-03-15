import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // generateSW: Workbox writes the entire service worker for you.
      // No custom sw.js needed — push handlers are added via additionalManifestEntries
      // and importScripts below. This is the most reliable strategy.
      registerType: 'autoUpdate',
      injectRegister: 'auto',

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
        // Precache all build output
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Network-first for Supabase — never serve stale data
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

        // Serve app shell for all navigation (offline routing works)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        cleanupOutdatedCaches: true,

        // Push notification handlers injected directly into the generated SW
        additionalManifestEntries: [],
        importScripts: ['/push-handler.js'],
      },

      devOptions: {
        enabled: false,
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