import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the Buchunt Express server (node index.js, port 3001)
      '/api': 'http://localhost:3001',
    },
  },
})
