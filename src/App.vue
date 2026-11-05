<script setup lang="ts">
import { ref, computed } from 'vue'
import { themeList, getThemeKey } from '@/utils/themeKey'
import { useRouter, useRoute, type RouteRecordRaw } from 'vue-router'

const activeThemeKey = ref(getThemeKey())
function switchThemeKey(key: string) {
  activeThemeKey.value = key
  // 全局切换方式：window.setTheme(key) 改写 --colorX 等 CSS 变量，并联动 3D 场景
  window.setTheme?.(key)
}

// 滑动高亮块位置：主题选择器按索引 + 单项占比，路由菜单按索引
const themeIndex = computed(() =>
  Math.max(0, themeList.findIndex((t) => t.key === activeThemeKey.value)),
)
const themeTrackStyle = computed(() => ({
  '--i': themeIndex.value,
  '--ratio': 1 / themeList.length,
}))

const router = useRouter()
const route = useRoute()

// 从路由表提取带 meta.title 的菜单项（含嵌套子路由）
const menuList = router.options.routes
  .flatMap((route: RouteRecordRaw) => [route, ...(route.children ?? [])])
  .filter((route: RouteRecordRaw) => route.meta?.title)

const menuIndex = computed(() =>
  Math.max(0, menuList.findIndex((item: RouteRecordRaw) => item.name === route.name)),
)
</script>

<template>
  <div class="page">
    <div class="theme-switch" :style="themeTrackStyle">
      <button
        v-for="t in themeList"
        :key="t.key"
        :class="{ active: activeThemeKey === t.key }"
        :style="{ '--swatch': t.themeColor }"
        @click="switchThemeKey(t.key)"
      >
        <span class="dot"></span><span class="label">{{ t.key }}</span>
      </button>
    </div>

    <!-- 悬浮左侧居中 · 玻璃轨道路由菜单 -->
    <nav class="side-menu" :style="{ '--i': menuIndex }">
      <router-link
        v-for="(item, i) in menuList"
        :key="item.path"
        :to="{ name: item.name }"
        class="side-item"
        :class="{ active: route.name === item.name }"
      >
        <span class="idx">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="label">{{ item.meta?.title }}</span>
      </router-link>
    </nav>

    <main class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped lang="scss">
.page {
  height: 100%;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ===== 统一设计语言：玻璃轨道 + 滑动高亮块 ===== */
.theme-switch,
.side-menu {
  position: fixed;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(18px) saturate(170%);
  -webkit-backdrop-filter: blur(18px) saturate(170%);
  box-shadow: 0 16px 38px var(--color5_3), inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.theme-switch::before,
.side-menu::before {
  content: '';
  position: absolute;
  border-radius: 12px;
  background: linear-gradient(120deg, var(--color3), var(--color6));
  box-shadow: 0 8px 20px var(--color4_5), inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: transform 0.42s cubic-bezier(0.2, 0.85, 0.25, 1), background 0.3s ease;
}

/* 右上：主题选择器，滑块横向滑动 */
.theme-switch {
  top: 16px;
  right: 16px;
  z-index: 30;
  display: flex;
  border-radius: 16px;
}

.theme-switch::before {
  top: 6px;
  bottom: 6px;
  left: 6px;
  width: calc((100% - 12px) * var(--ratio, 0.25));
  transform: translateX(calc(var(--i, 0) * 100%));
}

.theme-switch button {
  position: relative;
  z-index: 1;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 74px;
  padding: 9px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--color7);
  transition: color 0.25s ease, transform 0.2s ease, background 0.25s ease;
}

.theme-switch button:not(.active):hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.28);
}

.theme-switch button.active {
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.theme-switch .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--swatch, #fff);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.theme-switch button.active .dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

/* 左侧：竖向轨道，滑块纵向滑动 */
.side-menu {
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 20px;
}

.side-menu::before {
  left: 6px;
  top: 6px;
  width: calc(100% - 12px);
  height: 48px;
  transform: translateY(calc(var(--i, 0) * 58px));
}

.side-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 138px;
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--color7);
  transition: color 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

.side-item .idx {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.side-item:not(.active):hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.3);
  color: var(--color5);
}

.side-item.active {
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.28);
}

.side-item.active .idx {
  opacity: 0.85;
}

.content {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch::before,
  .side-menu::before,
  .theme-switch button,
  .side-item {
    transition: none;
  }
}
</style>
