import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The client is a standalone deployable: it builds to ./dist and talks to the
// API over VITE_API_URL, so it can ship to any static host independently of
// the server. See DEPLOYMENT.md.
//
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The third arg ('') loads vars without the VITE_ prefix too, so the dev
  // proxy target can be configured without exposing it to client code.
  const env = loadEnv(mode, import.meta.dirname, '')

  return {
    plugins: [react(), tailwindcss()],

    server: {
      port: Number(env.CLIENT_PORT) || 5173,
      // Listen on the LAN as well, so the app can be opened on a phone to
      // check the mobile layout against a real device.
      host: true,
      // Only used when VITE_API_URL is empty: requests stay relative and get
      // proxied here, which keeps them same-origin during development.
      proxy: {
        '/api': {
          target: env.DEV_API_PROXY || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },

    preview: {
      port: Number(env.PREVIEW_PORT) || 4173,
      host: true,
    },

    build: {
      outDir: 'dist',
      // Source maps in preview/staging builds only — they roughly double the
      // deploy size and expose the original source.
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Keep React and the router in their own chunk so app changes don't
          // invalidate the biggest, most stable part of the bundle. Rolldown
          // (Vite 8) only accepts the function form here.
          manualChunks(id) {
            if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor'
            }
            return null
          },
        },
      },
    },
  }
})
