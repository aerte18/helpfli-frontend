import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // Jedna kopia Reacta — react-leaflet w osobnym chunku inaczej trafia na undefined createContext
    dedupe: ['react', 'react-dom', 'react-leaflet', '@react-leaflet/core'],
  },
  define: {
    'process.env': {}, // Leaflet require()
    // VITE_GATEWAY_AI_BASE i VITE_API_URL z .env – nie hardcoduj dla produkcji
  },
  // Pozwalamy Rollupowi zachować granice dynamicznych importów. Globalny
  // `vendor` chunk wciągał Leaflet do początkowego ładowania każdej trasy.
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
  }
})
