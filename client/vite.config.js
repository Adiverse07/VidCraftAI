// vite.config.js
import { defineConfig } from 'vite'
import react       from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward POST /generate → http://localhost:5000/generate
      '/generate': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Forward GET /videos/*    → http://localhost:5000/videos/*
      '/videos': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
