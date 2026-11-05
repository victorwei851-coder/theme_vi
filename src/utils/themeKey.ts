/**
 * 主题色配置
 * 包含 黑白灰 + 主题色板，并自动为每个颜色生成 10 级透明度
 */

import type { App } from 'vue'
import appConfig from '../static/config'

// ---- 类型声明 ----
declare global {
  interface Window {
    _CONFIG?: { styleTheme?: string }
    styleThemeList?: Record<string, string>[]
    setTheme?: (name?: string) => void
    setCustom?: (val?: string) => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $themeColor: (key: string) => string
    $getThemePath: () => string
  }
}

// 当前主题 key：优先取运行期全局配置 window._CONFIG.styleTheme，
// 其次取本地配置文件 src/static/config.ts 的 themeKey，再回退 'normal'
const configThemeKey: string =
  (typeof window !== 'undefined' && window._CONFIG?.styleTheme) ||
  appConfig?.themeKey ||
  'normal'

// 主题样式路径片段（部分路径，用于拼接），如 src/assets/imgs/theme_blue 或 src/assets/imgs/normal
export const styleThemePath =
  configThemeKey && configThemeKey !== 'normal'
    ? 'src/assets/imgs/theme_' + configThemeKey
    : 'src/assets/imgs/normal'

let styleThemeList: Record<string, string>[] = [
  {
    // 默认主题
    key: 'normal',
    themeColor: '#006655',
    color1: '#B2FFF2',
    color2: '#5CE5CE',
    color3: '#29CCB1',
    color4: '#009980',
    color5: '#006655',
    color6: '#00332B',
    color7: '#001A15',
    white: '#FFFFFF',
    black: '#000000',
    gray1: '#E6F2F0',
    gray2: '#CFE1E5',
    gray3: '#ADCCC7',
    gray4: '#829995',
    gray5: '#576663',
    gray6: '#2B3332',
    warning1: '#FFE5E5',
    warning2: '#FFB2B2',
    warning3: '#E55C5C',
    warning4: '#CC2929',
    warning5: '#990F0F',
    warning6: '#660A0A',
    warning7: '#330000',
    special1: '#FFF6E5',
    special2: '#FFE5B2',
    special3: '#FFCC66',
    special4: '#FFAA00',
    special5: '#CC8800',
    special6: '#996600',
    special7: '#664400',
    red: '#FF5151',
    orange: '#FF942A',
    yellow: '#F0C800',
    green: '#00D547',
    lightBlue: '#00BFE5',
    deepBlue: '#4545FF',
    purple: '#B41DFF',
    magenta: '#E40098',
  },
  {
    // 蓝色主题
    key: 'blue',
    themeColor: '#66CCFF',
    color1: '#B2E5FF',
    color2: '#66CCFF',
    color3: '#33BBFF',
    color4: '#0088CC',
    color5: '#005580',
    color6: '#002233',
    color7: '#00111A',
    white: '#FFFFFF',
    black: '#000000',
    gray1: '#E6F0F2',
    gray2: '#CFE1E5',
    gray3: '#ADC7CC',
    gray4: '#829599',
    gray5: '#576466',
    gray6: '#2B3233',
    warning1: '#FFE5E5',
    warning2: '#FFB2B2',
    warning3: '#E55C5C',
    warning4: '#CC2929',
    warning5: '#990F0F',
    warning6: '#660A0A',
    warning7: '#330000',
    special1: '#FFF4E5',
    special2: '#FFDFB2',
    special3: '#E5AC5C',
    special4: '#CC8829',
    special5: '#995900',
    special6: '#663C00',
    special7: '#331E00',
    red: '#FF5151',
    orange: '#FF942A',
    yellow: '#F0C800',
    green: '#00D547',
    lightBlue: '#00BFE5',
    deepBlue: '#4545FF',
    purple: '#B41DFF',
    magenta: '#E40098',
  },
  {
    // 橙色主题
    key: 'orange',
    themeColor: '#fa8c16',
    color1: '#FFE5B2',
    color2: '#FFCC80',
    color3: '#FFB24D',
    color4: '#FA8C16',
    color5: '#AD6600',
    color6: '#7A3F00',
    color7: '#3D1F00',
    gray1: '#E6F0F2',
    gray2: '#CFE1E5',
    gray3: '#ADC7CC',
    gray4: '#829599',
    gray5: '#576466',
    gray6: '#2B3233',
    warning1: '#FFE5E5',
    warning2: '#FFB2B2',
    warning3: '#E55C5C',
    warning4: '#CC2929',
    warning5: '#990F0F',
    warning6: '#660A0A',
    warning7: '#330000',
    special1: '#FFF4E5',
    special2: '#FFDFB2',
    special3: '#E5AC5C',
    special4: '#CC8829',
    special5: '#995900',
    special6: '#663C00',
    special7: '#331E00',
  },
  {
    // 自定义主题
    key: 'custom',
    color1: '#B2FFF2',
    color2: '#5CE5CE',
    color3: '#29CCB1',
    color4: '#009980',
    color5: '#006655',
    color6: '#00332B',
    color7: '#001A15',
    white: '#FFFFFF',
    black: '#000000',
    gray1: '#E6F0F2',
    gray2: '#CFE1E5',
    gray3: '#ADC7CC',
    gray4: '#829599',
    gray5: '#576466',
    gray6: '#2B3233',
    warning1: '#FFE5E5',
    warning2: '#FFB2B2',
    warning3: '#E55C5C',
    warning4: '#CC2929',
    warning5: '#990F0F',
    warning6: '#660A0A',
    warning7: '#330000',
    special1: '#FFF4E5',
    special2: '#FFDFB2',
    special3: '#E5AC5C',
    special4: '#CC8829',
    special5: '#995900',
    special6: '#663C00',
    special7: '#331E00',
    red: '#FF5151',
    orange: '#FF942A',
    yellow: '#F0C800',
    green: '#00D547',
    lightBlue: '#00BFE5',
    deepBlue: '#4545FF',
    purple: '#B41DFF',
    magenta: '#E40098',
  },
]

// 定义透明度列表
const opacityList = ['00', '1A', '33', '4D', '66', '80', '99', 'B3', 'CC', 'E6', 'FF']

// 设置透明度的方法
const setOpacity = (val: Record<string, string>, key: string, color: string) => {
  for (let index = 0; index < 10; index++) {
    val[key + '_' + index] = color + opacityList[index]
  }
}

// 需要增加透明度的颜色列表
const filterList = [
  'color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7',
  'warning1', 'warning2', 'warning3', 'warning4', 'warning5', 'warning6', 'warning7',
  'gray1', 'gray2', 'gray3', 'gray4', 'gray5', 'gray6',
  'special1', 'special2', 'special3', 'special4', 'special5', 'special6', 'special7',
  'orange', 'yellow',
]

// 增加透明度到颜色列表中
styleThemeList = styleThemeList.map((item: Record<string, string>) => {
  for (const key in item) {
    if (filterList.includes(key)) {
      setOpacity(item, key, item[key])
    }
  }
  return item
})

// 当前生效的主题（模块级，不依赖 window，Node 端安全）
let currentTheme: Record<string, string> | undefined = styleThemeList.find(
  (item) => item.key === configThemeKey,
)

// 修改页面中的样式变量值（仅浏览器环境调用）
const changeStyle = (obj: Record<string, string>) => {
  const root = document.documentElement
  for (const key in obj) {
    root.style.setProperty(`--${key}`, obj[key])
  }
}

// 改变主题的方法
const setTheme = (themeName?: string) => {
  if (themeName) {
    currentTheme = styleThemeList.find((item) => item.key === themeName)
  }
  if (currentTheme) {
    changeStyle(currentTheme)
  }
}

// 主题扩展方法，自定义主题
const hexToRgb = (hex: string, factor: number) => {
  const r = Number(parseInt('0x' + hex.slice(1, 3)))
  const g = Number(parseInt('0x' + hex.slice(3, 5)))
  const b = Number(parseInt('0x' + hex.slice(5, 7)))

  const nr = Math.min(255, Math.floor(r * factor + 255 * (1 - factor)))
  const ng = Math.min(255, Math.floor(g * factor + 255 * (1 - factor)))
  const nb = Math.min(255, Math.floor(b * factor + 255 * (1 - factor)))
  return `rgb(${nr},${ng},${nb})`
}

const RGBToHex = (rgb?: string) => {
  const source = rgb || 'rgb(237,237,237)'
  const regexp = /[0-9]{0,3}/g
  const res = source.match(regexp) ?? []
  const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
  const hexArr: string[] = []
  for (let i = 0; i < res.length; i++) {
    if (res[i]) {
      if (+res[i] > 16) {
        const leftIndex = (+res[i] / 16) >> 0
        const rightIndex = +res[i] % 16
        hexArr.push(hex[leftIndex])
        hexArr.push(hex[rightIndex])
      } else {
        hexArr.push('0')
        hexArr.push(hex[+res[i]])
      }
    }
  }
  return '#' + hexArr.join('')
}

const setCustom = (val?: string) => {
  if (!val) return
  styleThemeList.forEach((item) => {
    if (item.key === 'custom') {
      for (let index = 1; index < 8; index++) {
        const factor = 0.1 + (index - 1) * 0.13
        item['color' + index] = RGBToHex(hexToRgb(val, factor))
      }
    }
  })
  styleThemeList = styleThemeList.map((item) => {
    for (const key in item) {
      if (filterList.includes(key)) {
        setOpacity(item, key, item[key])
      }
    }
    return item
  })
  setTheme('custom')
}

// 按 key 取主题色，找不到则返回原值
export const themeColor = (key: string): string => {
  return currentTheme && currentTheme[key] ? currentTheme[key] : key
}

// 取主题样式路径片段
const getThemePath = (): string => styleThemePath

// 场景关键色：从当前主题色板派生（供 Three.js 等使用），让 3D 别墅庭院随主题换色
// 注：带贴图的材质(roof/wood/woodDark)用 *Tint 浅色叠加，避免与贴图相乘后发黑；
//     纯色材质(leaf/leafLight/cushion/terracotta/blossom)用完整色。
const sceneBase = {
  leaf: ['#3e6b3a', '#4d7a40', '#5c8650', '#2f4a2f'],
  leafLight: ['#7fae77', '#8fbd86', '#9ec98f', '#6f9a6a'],
  roofTint: '#e9d9c6',
  woodTint: '#e3d2bb',
  woodDarkTint: '#cfc0ac',
  roof: '#9a5744',
  roofDark: '#5c4136',
  wood: '#7a563a',
  woodDark: '#5b4030',
  cushion: '#bfb39d',
  terracotta: '#9a664d',
  blossom: ['#d6a4a7', '#e3bebc', '#c98594'],
}
type SceneColors = typeof sceneBase
const sceneOverrides: Record<string, Partial<SceneColors>> = {
  blue: {
    leaf: ['#356b5e', '#3f7a66', '#4d8a72', '#2a4a42'],
    leafLight: ['#7fae9e', '#8fbda6', '#9ec9b3', '#6f9a8c'],
    roofTint: '#e0dce0', woodTint: '#d8dee2', woodDarkTint: '#c4ccd2',
    roof: '#8a5a4a', roofDark: '#4f352c', wood: '#5f6b66', woodDark: '#454f4b',
    cushion: '#cdd9e0', terracotta: '#8a6a5a', blossom: ['#bcd8e8', '#cfe6f1', '#a9c4d6'],
  },
  orange: {
    leaf: ['#4a6b3a', '#587a40', '#688f4d', '#36492a'],
    leafLight: ['#9ab277', '#a9bf86', '#b8cf93', '#8aa56a'],
    roofTint: '#f0ddc6', woodTint: '#ecd9bf', woodDarkTint: '#dcbf9f',
    roof: '#a85c3a', roofDark: '#623524', wood: '#7a563a', woodDark: '#5b3f30',
    cushion: '#e0c9a8', terracotta: '#b56a4d', blossom: ['#e8b98a', '#f0d0a8', '#d99e72'],
  },
  custom: {},
}
export const getSceneColors = (): SceneColors => {
  const key = currentTheme?.key ?? 'normal'
  const override = sceneOverrides[key] ?? {}
  const merged: any = {}
  for (const k in sceneBase) merged[k] = (override as any)[k] ?? (sceneBase as any)[k]
  return merged as SceneColors
}

// 取当前激活的主题 key（供组件高亮当前项 / 读取当前状态）
export const getThemeKey = (): string => currentTheme?.key ?? 'normal'

// ---- Vue3 插件：将方法挂到全局（替代 Vue2 的 Vue.prototype） ----
export const themeKey = {
  install(app: App) {
    app.config.globalProperties.$themeColor = themeColor
    app.config.globalProperties.$getThemePath = getThemePath
    // 应用默认主题
    setTheme()
  },
}

// ---- 浏览器全局（仅在浏览器环境挂载，避免污染 Node / vite.config） ----
if (typeof window !== 'undefined') {
  window.styleThemeList = styleThemeList
  window.setTheme = setTheme
  window.setCustom = setCustom
}

// 导出最终（含透明度）主题列表，供应用层使用
export const themeList = styleThemeList
