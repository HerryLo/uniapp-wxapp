import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5173,
    proxy: {
      '/yuque-api': {
        target: 'https://www.yuque.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yuque-api/, ''),
      },
    },
  },
})
