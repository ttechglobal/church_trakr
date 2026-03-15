import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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