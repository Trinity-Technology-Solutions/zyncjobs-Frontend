import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://api.zyncjobs.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://api.zyncjobs.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    historyApiFallback: true,
  },
})
