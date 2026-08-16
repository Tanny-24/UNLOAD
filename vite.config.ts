import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_PORT = process.env.PORT ?? '8787'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset URLs so the built files also work when the desktop shell
  // loads them straight off disk.
  base: './',
  build: {
    rollupOptions: {
      input: {
        // The app itself.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // The small always-on-top desktop companion window.
        pet: fileURLToPath(new URL('./pet.html', import.meta.url)),
      },
    },
  },
  server: {
    port: 5273,
    proxy: {
      // The API key never reaches the browser: all model calls go
      // through the tiny Express service in /server.
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
})
