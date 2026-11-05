<template>
  <div class="svg-page">
    <header class="page-head">
      <div class="head-row">
        <div>
          <h2>SVG 图标库</h2>
          <p>共 {{ icons.length }} 个图标 · 颜色由主题色 --colorN 驱动，点击卡片复制用法</p>
        </div>
        <input v-model="keyword" class="search" type="search" placeholder="搜索图标名…" />
      </div>
    </header>

    <p v-if="!filtered.length" class="empty">没有匹配的图标</p>

    <section v-for="group in groups" :key="group.title" class="group">
      <h3>{{ group.title }} <span>{{ group.items.length }}</span></h3>
      <div class="cards">
        <button
          v-for="item in group.items"
          :key="item.id"
          class="icon-card"
          :class="{ copied: copied === item.id }"
          :title="`#${item.id}`"
          @click="copyUsage(item)"
        >
          <span class="icon-box">
            <SvgIcon :icon-class="item.iconClass" :size="40" />
          </span>
          <span class="icon-name">{{ item.iconClass }}</span>
          <span class="icon-tip">{{ copied === item.id ? '已复制' : '点击复制' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import iconNames from 'virtual:svg-icons-names'

// vite.config 中 symbolId 为 'icon-[name]'，去掉 icon- 前缀即为组件的 iconClass
const icons = iconNames
  .map((id) => ({ id, iconClass: id.replace(/^icon-/, '') }))
  .sort((a, b) => a.iconClass.localeCompare(b.iconClass, undefined, { numeric: true }))

const keyword = ref('')
const copied = ref('')

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return k ? icons.filter((item) => item.id.toLowerCase().includes(k)) : icons
})

const groups = computed(() => {
  const map = new Map()
  filtered.value.forEach((item) => {
    const key = item.iconClass.split('_')[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map, ([title, items]) => ({ title, items }))
})

async function copyUsage(item) {
  try {
    await navigator.clipboard.writeText(`<SvgIcon icon-class="${item.iconClass}" />`)
  } catch {
    return
  }
  copied.value = item.id
  window.setTimeout(() => {
    if (copied.value === item.id) copied.value = ''
  }, 1200)
}
</script>

<style scoped>
.svg-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px 28px 48px 130px;
  background: linear-gradient(135deg, var(--color1_3), var(--color2_1) 50%, var(--color1_2));
}

.page-head {
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

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color7);
}

.page-head p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--gray6, var(--color6));
}

.search {
  width: 220px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  border-radius: 10px;
  border: 1px solid var(--color3_5);
  outline: none;
  color: var(--color7);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search::placeholder {
  color: var(--gray5, var(--color5));
}

.search:focus {
  border-color: var(--color5);
  box-shadow: 0 0 0 3px var(--color3_3);
}

.group {
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
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 12px;
  perspective: 900px;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 16px 8px 10px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.16));
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 8px 22px var(--color5_2), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  color: var(--color6);
  transition:
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.icon-card:hover {
  transform: translateY(-6px) scale(1.03) rotateX(2deg);
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 36px var(--color5_3), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.icon-box {
  color: var(--color5);
  transition: color 0.25s ease, transform 0.25s ease;
}

.icon-card:hover .icon-box {
  color: var(--color3);
  transform: scale(1.12);
}

.icon-name {
  font-size: 12px;
  letter-spacing: 0.3px;
}

.icon-tip {
  font-size: 10px;
  opacity: 0.6;
}

.icon-card.copied {
  border-color: var(--color5);
  box-shadow: 0 0 0 2px var(--color3_4), 0 12px 26px var(--color5_3);
}

.icon-card.copied .icon-tip {
  opacity: 1;
  color: var(--color5);
}

.empty {
  max-width: 1280px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--color6);
}

@media (prefers-reduced-motion: reduce) {
  .icon-card,
  .icon-box {
    transition: none;
  }

  .icon-card:hover {
    transform: none;
  }
}

@media (max-width: 900px) {
  .svg-page {
    padding-left: 24px;
    padding-top: 60px;
  }

  .search {
    width: 100%;
  }
}
</style>
