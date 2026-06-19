import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3002'

  console.log('🔧 Vite proxy target:', proxyTarget)

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Split large chunks so browser can cache them separately
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-redux': ['@reduxjs/toolkit'],
            'vendor-sentry': ['@sentry/react'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
      // Warn when any chunk exceeds 500KB
      chunkSizeWarningLimit: 500,
      // Minify with esbuild (default, fast)
      minify: 'esbuild',
      // Enable source maps only in non-prod
      sourcemap: mode !== 'production',
    },
    server: {
      port: 5173,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        overlay: false,
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            console.log('🔧 API proxy configured for:', options.target)
          }
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
