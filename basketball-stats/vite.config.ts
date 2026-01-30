import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // GitHub Pages SPA：复制 index.html 为 404.html，刷新子路径时由 404 页加载应用
    {
      name: 'copy-404',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist')
        const src = path.join(outDir, 'index.html')
        const dest = path.join(outDir, '404.html')
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
        }
      },
    },
  ],
  // GitHub Pages：自定义域名用根路径 base '/'；*.github.io 用 '/<仓库名>/'
  base:
    process.env.GITHUB_PAGES === 'true'
      ? process.env.BASE_PATH
        ? `/${String(process.env.BASE_PATH).replace(/^\/|\/$/g, '')}/`
        : '/'
      : '/',
})
