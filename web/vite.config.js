import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const normalizeBackendUrl = (value) => {
  if (!value || !/^https?:\/\//.test(value)) return undefined
  return value.replace(/\/api\/?$/, '').replace(/\/$/, '')
}

const renderAllowedOrigin = 'https://front-end-tcc-ten.vercel.app'

const useRenderAllowedOrigin = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => {
    proxyReq.setHeader('origin', renderAllowedOrigin)
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl =
    normalizeBackendUrl(env.VITE_API_PROXY_TARGET) ||
    normalizeBackendUrl(env.VITE_API_URL) ||
    'https://tcc-backend-jqod.onrender.com'

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used - do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
          headers: {
            origin: renderAllowedOrigin,
          },
          configure: useRenderAllowedOrigin,
        },
        '/ws': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
          ws: true,
          headers: {
            origin: renderAllowedOrigin,
          },
          configure: useRenderAllowedOrigin,
        },
      },
    },
    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
    build: {
      // Current bundle is ~970 kB; increase the warning limit to avoid false-positive noise in CI/local builds.
      chunkSizeWarningLimit: 1200,
    },
  }
})
