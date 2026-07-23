import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/genart/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mobile: resolve(__dirname, 'mobile.html')
      }
    }
  }
})
