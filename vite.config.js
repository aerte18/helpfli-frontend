import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
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
  }
})