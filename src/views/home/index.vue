<template>
  <div
    class="palette-page"
    :style="backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : null"
  >
    <header class="page-head">
      <h2>当前主题色卡</h2>
      <p>
        当前色板：<b>{{ currentKey }}</b> · 列出全部基础色及 0~9 级透明度；
        小格铺棋盘底纹以便观察透明效果，右上角切换主题会实时刷新
      </p>
    </header>

    <section v-for="group in groups" :key="group.title" class="group">
      <h3>{{ group.title }} <span>{{ group.items.length }} 色</span></h3>
      <div class="cards">
        <article v-for="item in group.items" :key="item.name" class="color-card">
          <div class="swatch" :class="{ 'is-light': item.isLight }" :style="{ background: item.value }">
            <span class="swatch-name">--{{ item.name }}</span>
            <span class="swatch-hex">{{ item.value }}</span>
          </div>

          <div class="steps">
            <div
              v-for="step in item.steps"
              :key="step.level"
              class="step"
              :style="{ background: step.color }"
              :title="`${step.source} · ${step.color} · ${step.label}`"
            ></div>
          </div>

          <div class="card-foot">
            <span>透明度 0 → 9</span>
            <span>{{ item.hasVars ? '主题变量' : '实时计算' }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { themeList, getThemeKey } from '@/utils/themeKey'

// 原来的 @style-theme/img1.png：改用 glob 加载确保 URL 有效，并随主题切换
const bgModules = import.meta.glob('../../assets/imgs/*/img1.png', { eager: true, import: 'default' })

// 与 themeKey.ts 的 setOpacity 一致：_0 ~ _9 对应的 alpha 十六进制
const OPACITY_CODES = ['00', '1A', '33', '4D', '66', '80', '99', 'B3', 'CC', 'E6']

const GROUP_RULES = [
  { title: '主色阶', match: (k) => k === 'themeColor' || /^color[1-7]$/.test(k) },
  { title: '中性色', match: (k) => k === 'white' || k === 'black' || /^gray[1-6]$/.test(k) },
  { title: '警示色', match: (k) => /^warning[1-7]$/.test(k) },
  { title: '特殊色', match: (k) => /^special[1-7]$/.test(k) },
  {
    title: '功能色',
    match: (k) => ['red', 'orange', 'yellow', 'green', 'lightBlue', 'deepBlue', 'purple', 'magenta'].includes(k),
  },
]

const groups = ref([])
const currentKey = ref(getThemeKey())
const backgroundUrl = ref('')

function resolveBackground() {
  const key = getThemeKey()
  const folder = key === 'normal' ? 'normal' : ['blue', 'orange'].includes(key) ? `theme_${key}` : 'theme_blue'
  return bgModules[`../../assets/imgs/${folder}/img1.png`] || Object.values(bgModules)[0] || ''
}

function toRgb(value) {
  if (!value) return null
  const s = value.trim()
  if (s[0] === '#') {
    const h = s.slice(1)
    if (h.length === 6 || h.length === 8) {
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
  }
  const m = s.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

function readColors() {
  const cs = getComputedStyle(document.documentElement)
  const theme = themeList.find((t) => t.key === getThemeKey()) ?? themeList[0] ?? {}
  const baseKeys = Object.keys(theme).filter((k) => k !== 'key' && !/_\d$/.test(k))

  const items = baseKeys.map((name) => {
    const value = cs.getPropertyValue(`--${name}`).trim()
    const rgb = toRgb(value)
    const hasVars = !!cs.getPropertyValue(`--${name}_0`).trim()
    const steps = OPACITY_CODES.map((code, level) => {
      const varName = `--${name}_${level}`
      const varValue = cs.getPropertyValue(varName).trim()
      const alpha = parseInt(code, 16) / 255
      return {
        level,
        label: `${Math.round(alpha * 100)}%`,
        // 项目生成了透明度变量就用变量；否则由当前色实时计算
        color: varValue || (rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})` : 'transparent'),
        source: varValue ? varName : `computed from --${name}`,
      }
    })
    const luminance = rgb ? rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 : 255
    return { name, value, steps, hasVars, isLight: luminance > 150 }
  })

  const matched = new Set()
  const grouped = GROUP_RULES.map((rule) => {
    const list = items.filter((item) => {
      const ok = rule.match(item.name)
      if (ok) matched.add(item.name)
      return ok
    })
    return { title: rule.title, items: list }
  }).filter((g) => g.items.length)

  const rest = items.filter((item) => !matched.has(item.name))
  if (rest.length) grouped.push({ title: '其它', items: rest })
  groups.value = grouped
  currentKey.value = getThemeKey()
  backgroundUrl.value = resolveBackground()
}

let observer = null
onMounted(() => {
  readColors()
  let raf = 0
  observer = new MutationObserver(() => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      readColors()
    })
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.palette-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px 28px 48px 130px;
  background-color: var(--color1_2);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
}

/* 主题色薄纱：压住背景图并轻微虚化，让上层毛玻璃有层次 */
.palette-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(135deg, var(--color1_5), var(--color2_2) 48%, var(--color1_4));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.page-head {
  position: relative;
  max-width: 1280px;
  margin: 0 auto 22px;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.44), rgba(255, 255, 255, 0.2));
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 10px 30px var(--color5_3), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color7);
}

.page-head p {
  margin: 6px 0 0;
  max-width: 560px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--gray6, var(--color6));
}

.page-head b {
  color: var(--color5);
}

.group {
  position: relative;
  max-width: 1280px;
  margin: 0 auto 22px;
}

.group h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--color7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 14px var(--color4_2);
}

.group h3 span {
  font-size: 12px;
  font-weight: 400;
  color: var(--gray5, var(--color5));
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(212px, 1fr));
  gap: 14px;
  perspective: 1000px;
}

.color-card {
  position: relative;
  overflow: hidden;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.16));
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  box-shadow:
    0 10px 26px var(--color5_3),
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

/* 移入时斜向高光扫过 */
.color-card::after {
  content: '';
  position: absolute;
  inset: -40% -60%;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-70%);
  background: linear-gradient(115deg, transparent 42%, rgba(255, 255, 255, 0.55) 50%, transparent 58%);
  transition: transform 0.65s ease, opacity 0.3s ease;
}

.color-card:hover {
  z-index: 2;
  transform: translateY(-10px) scale(1.025) rotateX(2deg) rotateY(-2deg);
  border-color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.24));
  box-shadow:
    0 26px 48px var(--color5_4),
    0 6px 14px var(--color4_3),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.color-card:hover::after {
  opacity: 1;
  transform: translateX(70%);
}

.swatch {
  height: 72px;
  border-radius: 9px;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 4px 10px rgba(0, 0, 0, 0.12);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.swatch.is-light {
  color: var(--color7);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.55);
}

.swatch-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.swatch-hex {
  font-size: 11px;
  opacity: 0.9;
  letter-spacing: 0.5px;
}

/* 棋盘底纹用于观察半透明色 */
.steps {
  display: flex;
  margin-top: 9px;
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid var(--color2_4);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  background: repeating-conic-gradient(#e9edec 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px;
}

.step {
  flex: 1;
  height: 26px;
  transition: transform 0.15s ease;
}

.step:hover {
  transform: scaleY(1.28);
}

.card-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  font-size: 10px;
  color: var(--gray6, var(--color6));
}

@media (prefers-reduced-motion: reduce) {
  .color-card,
  .color-card::after {
    transition: none;
  }

  .color-card:hover {
    transform: none;
  }

  .color-card:hover::after {
    opacity: 0;
  }
}

@media (max-width: 900px) {
  .palette-page {
    padding-left: 24px;
    padding-top: 60px;
    background-attachment: scroll;
  }

  .page-head p {
    max-width: 100%;
  }
}
</style>
