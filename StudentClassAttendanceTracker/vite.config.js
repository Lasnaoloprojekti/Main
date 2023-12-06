import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/r1': {
        target: 'https://opendata.metropolia.fi',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});