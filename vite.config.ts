import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { styleThemePath } from './src/utils/themeKey'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// 路径变量：把 themeKey.ts 的部分路径片段 styleThemePath 拼接到基础目录，得到完整绝对路径
// 例如 styleThemePath 为 '/theme_blue/' 时 => <root>/src/styles/theme/theme_blue
const styleThemeFullPath = path.resolve(
  rootDir,
  styleThemePath.replace(/^\//, ''),
)

export default defineConfig({
  plugins: [
    vue(),
    // 把 src/assets/svg 下的 svg 编译成 <symbol> 雪碧图，id 为 icon-[文件名]
    createSvgIconsPlugin({
      iconDirs: [path.resolve(rootDir, 'src/assets/svg')],
      symbolId: 'icon-[name]',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@style-theme': styleThemeFullPath,
    },
  },
  define: {
    // 同时将逻辑路径暴露给运行时，便于动态拼接样式资源地址
    __STYLE_THEME_PATH__: JSON.stringify(styleThemePath),
  },
})
