import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // CI sets VITE_BASE=/penultimate/ for GitHub Pages; local/dev stays at /.
  base: process.env.VITE_BASE ?? '/',
})
