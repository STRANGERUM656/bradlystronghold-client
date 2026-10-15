import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  // Se pubblichi su GitHub Pages, scommenta la riga sotto e metti il nome del tuo repository
  // base: '/bradlystronghold/',
})
