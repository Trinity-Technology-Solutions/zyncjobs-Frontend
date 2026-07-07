import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  console.log('🔧 Vite proxy target:', proxyTarget)

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-socket': ['socket.io-client'],
            'vendor-lucide': ['lucide-react'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'pdfjs-dist'],
            'vendor-office': ['docx', 'mammoth', 'jszip'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : ['debugger'],
      },
      cssCodeSplit: true,
      sourcemap: false,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
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
