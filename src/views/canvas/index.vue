<template>
  <div class="canvas-page">
    <header class="page-head">
      <h2>主题色图表</h2>
      <p>色彩取自 --color1 ~ --color7，叠加 --colorN_0 ~ _9 透明度层级；切换主题实时重绘</p>
    </header>

    <div class="grid">
      <section class="card">
        <h3>立体折线图</h3>
        <div ref="lineRef" class="chart"></div>
      </section>
      <section class="card">
        <h3>环形图</h3>
        <div ref="doughnutRef" class="chart"></div>
      </section>
      <section class="card">
        <h3>饼图</h3>
        <div ref="pieRef" class="chart"></div>
      </section>
      <section class="card">
        <h3>散点图</h3>
        <div ref="scatterRef" class="chart"></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, PieChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent,
  CanvasRenderer,
])

const lineRef = ref(null)
const doughnutRef = ref(null)
const pieRef = ref(null)
const scatterRef = ref(null)

let charts = []
let observer = null
let resizeHandler = null

// 主题色变量由 themeKey 插件的 setTheme() 写入 document.documentElement.style
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()

// #RRGGBB / #RRGGBBAA -> rgba()，保证 ECharts 正确解析透明度
function toRgba(value, fallbackA = 1) {
  if (!value) return `rgba(41, 204, 177, ${fallbackA})`
  if (value[0] === '#') {
    const h = value.slice(1)
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : fallbackA
      return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`
    }
  }
  return value
}

const C = (n) => toRgba(cssVar(`color${n}`))
const A = (n, level) => toRgba(cssVar(`color${n}_${level}`) || cssVar(`color${n}`))
const textColor = () => C(7)

const vertical = (stops) => new echarts.graphic.LinearGradient(0, 0, 0, 1, stops)
const diagonal = (stops) => new echarts.graphic.LinearGradient(0, 0, 1, 1, stops)
const sphere = (stops) => new echarts.graphic.RadialGradient(0.32, 0.28, 0.85, stops)

const tooltipBase = () => ({
  backgroundColor: 'rgba(255,255,255,.92)',
  borderColor: A(3, 4),
  textStyle: { color: textColor(), fontSize: 12 },
})
const legendBase = (pos) => ({
  ...pos,
  type: 'scroll',
  textStyle: { color: textColor(), fontSize: 11 },
  itemWidth: 12,
  itemHeight: 8,
})
const axisBase = () => ({
  axisLine: { lineStyle: { color: A(3, 5) } },
  axisLabel: { color: textColor(), fontSize: 11 },
  splitLine: { lineStyle: { color: A(2, 3), type: 'dashed' } },
})

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const values = [28, 22, 18, 14, 10, 6, 4]
const keys = [1, 2, 3, 4, 5, 6, 7]

function lineData(n) {
  return months.map((_, i) => +(22 + n * 5 + Math.sin(i * 0.7 + n) * 13 + i * 2.4).toFixed(1))
}

function scatterData(seed) {
  const out = []
  for (let i = 0; i < 14; i++) {
    out.push([
      +(6 + i * 6.4 + Math.sin(i * 1.7 + seed) * 4).toFixed(1),
      +(12 + i * 2.4 + Math.sin(i * 0.9 + seed) * 20 + seed * 3).toFixed(1),
      +(10 + Math.abs(Math.cos(i + seed)) * 24).toFixed(1),
    ])
  }
  return out
}

// 渐变面积 + 高光描边 + 投影，形成立体飘带
function lineOption() {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...tooltipBase() },
    legend: legendBase({ top: 0 }),
    grid: { left: 44, right: 18, top: 38, bottom: 26 },
    xAxis: { type: 'category', boundaryGap: false, data: months, ...axisBase(), splitLine: { show: false } },
    yAxis: { type: 'value', ...axisBase() },
    series: [1, 3, 5, 7].map((n, idx) => ({
      name: `color${n}`,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 9,
      z: 10 - idx,
      data: lineData(n),
      lineStyle: {
        width: 4,
        color: vertical([
          { offset: 0, color: C(n) },
          { offset: 1, color: A(Math.min(n + 1, 7), 8) },
        ]),
        shadowBlur: 14,
        shadowColor: A(n, 6),
        shadowOffsetY: 8,
      },
      itemStyle: {
        color: C(n),
        borderColor: 'rgba(255,255,255,.9)',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: A(n, 6),
      },
      areaStyle: {
        color: vertical([
          { offset: 0, color: A(n, 5) },
          { offset: 1, color: A(n, 0) },
        ]),
      },
    })),
  }
}

// 下方深色饼层 + 上方渐变亮面层，模拟圆环厚度
function doughnutOption() {
  const base = keys.map((n, i) => ({ name: `color${n}`, value: values[i] }))
  const bottom = base.map((d, i) => ({
    ...d,
    itemStyle: { color: C(Math.min(i + 2, 7)), borderWidth: 0 },
  }))
  const top = base.map((d, i) => {
    const n = i + 1
    return {
      ...d,
      itemStyle: {
        color: diagonal([
          { offset: 0, color: A(Math.max(n - 1, 1), 8) },
          { offset: 1, color: C(n) },
        ]),
        borderColor: 'rgba(255,255,255,.85)',
        borderWidth: 2,
        borderRadius: 10,
        shadowBlur: 16,
        shadowColor: A(n, 6),
        shadowOffsetY: 8,
      },
    }
  })
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...tooltipBase() },
    legend: legendBase({ bottom: 0 }),
    series: [
      {
        type: 'pie',
        radius: ['40%', '66%'],
        center: ['50%', '50%'],
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        tooltip: { show: false },
        data: bottom,
        z: 1,
      },
      {
        type: 'pie',
        radius: ['40%', '66%'],
        center: ['50%', '45%'],
        label: { show: false },
        labelLine: { show: false },
        data: top,
        z: 3,
      },
    ],
  }
}

// 径向渐变做球面高光 + 底部厚度层，形成立体饼图
function pieOption() {
  const base = keys.map((n, i) => ({ name: `color${n}`, value: values[i] }))
  const bottom = base.map((d, i) => ({
    ...d,
    itemStyle: { color: C(Math.min(i + 2, 7)), borderWidth: 0 },
  }))
  const top = base.map((d, i) => {
    const n = i + 1
    return {
      ...d,
      itemStyle: {
        color: sphere([
          { offset: 0, color: A(Math.max(n - 1, 1), 9) },
          { offset: 0.65, color: C(n) },
          { offset: 1, color: A(Math.min(n + 1, 7), 9) },
        ]),
        borderColor: 'rgba(255,255,255,.8)',
        borderWidth: 2,
        borderRadius: 8,
        shadowBlur: 18,
        shadowColor: A(n, 6),
        shadowOffsetY: 6,
      },
    }
  })
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...tooltipBase() },
    legend: legendBase({ bottom: 0 }),
    series: [
      {
        type: 'pie',
        radius: '56%',
        center: ['50%', '52%'],
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        tooltip: { show: false },
        data: bottom,
        z: 1,
      },
      {
        type: 'pie',
        radius: '56%',
        center: ['50%', '46%'],
        label: { color: textColor(), fontSize: 10, formatter: '{b}' },
        labelLine: { lineStyle: { color: A(3, 5) } },
        emphasis: { scaleSize: 10 },
        data: top,
        z: 3,
      },
    ],
  }
}

// 径向渐变圆点做球体高光，尺寸映射第三维
function scatterOption() {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...tooltipBase() },
    legend: legendBase({ top: 0 }),
    grid: { left: 44, right: 18, top: 38, bottom: 26 },
    xAxis: { type: 'value', ...axisBase() },
    yAxis: { type: 'value', ...axisBase() },
    series: keys.map((n) => ({
      name: `color${n}`,
      type: 'scatter',
      data: scatterData(n),
      symbolSize: (v) => v[2],
      itemStyle: {
        color: sphere([
          { offset: 0, color: A(Math.max(n - 1, 1), 9) },
          { offset: 0.55, color: C(n) },
          { offset: 1, color: A(Math.min(n + 1, 7), 8) },
        ]),
        shadowBlur: 14,
        shadowColor: A(n, 6),
        shadowOffsetY: 5,
        opacity: 0.94,
      },
      emphasis: { scale: 1.35, itemStyle: { shadowBlur: 22 } },
    })),
  }
}

function renderAll() {
  const options = [lineOption(), doughnutOption(), pieOption(), scatterOption()]
  charts.forEach((chart, i) => chart && chart.setOption(options[i], true))
}

onMounted(() => {
  charts = [lineRef, doughnutRef, pieRef, scatterRef].map((r) => echarts.init(r.value))
  renderAll()

  resizeHandler = () => charts.forEach((chart) => chart && chart.resize())
  window.addEventListener('resize', resizeHandler)

  let raf = 0
  observer = new MutationObserver(() => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      renderAll()
    })
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  charts.forEach((chart) => chart && chart.dispose())
  charts = []
})
</script>

<style lang="scss" scoped>
.canvas-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px 28px 48px 130px;
  background: linear-gradient(135deg, var(--color1_3), var(--color2_1) 50%, var(--color1_2));
}

.page-head {
  max-width: 1280px;
  margin: 0 auto 18px;
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
  color: var(--gray6, var(--color6));
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  max-width: 1280px;
  margin: 0 auto;
}

.card {
  padding: 14px 16px 10px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.6));
  border: 1px solid var(--color1_6);
  box-shadow: 0 12px 30px var(--color1_4), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.card h3 {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--color7);
}

.chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 900px) {
  .canvas-page {
    padding-left: 24px;
    padding-top: 60px;
  }

  .page-head p {
    max-width: calc(100% - 320px);
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
