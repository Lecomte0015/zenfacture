import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@/components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@/pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@/layouts', replacement: path.resolve(__dirname, 'src/layouts') },
      { find: '@/context', replacement: path.resolve(__dirname, 'src/context') },
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
})