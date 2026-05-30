import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'process.env': {}, // Leaflet require()
    // VITE_GATEWAY_AI_BASE i VITE_API_URL z .env – nie hardcoduj dla produkcji
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Zmieniono z 5002 na 5000 zgodnie z PORT w backend/.env
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000', // Zmieniono z 5002 na 5000 zgodnie z PORT w backend/.env
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            if (id.includes("/pages/admin/") || id.includes("/components/admin/")) return "admin";
            if (id.includes("/pages/ProviderHome") || id.includes("MapView")) return "maps";
            return undefined;
          }
          if (id.includes("leaflet") || id.includes("react-leaflet")) return "leaflet";
          if (id.includes("recharts")) return "recharts";
          if (id.includes("@sentry")) return "sentry";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("socket.io")) return "socket";
          if (id.includes("@stripe")) return "stripe";
          if (id.includes("react-dom") || id.includes("react-router")) return "react-vendor";
        },
      },
    },
  },
})