import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/generate-roadmap': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/roadmap': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/planner': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/complete-task': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/log-hours': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/dashboard': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/videos': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/chat': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ai': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
