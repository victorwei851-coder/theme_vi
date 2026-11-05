<template>
  <svg
    class="svg-icon"
    :class="svgClass"
    :style="svgStyle"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : 'true'"
    focusable="false"
  >
    <title v-if="title">{{ title }}</title>
    <use :href="iconName" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'SvgIcon' })

interface Props {
  /** symbol 的 id 后缀，如 icon1_1 -> #icon-icon1_1 */
  iconClass: string
  /** 追加到根节点的自定义 class */
  className?: string
  /** 尺寸：数字按 px，字符串原样（如 '1.5em' / '24px'） */
  size?: string | number
  /** 颜色，作用于 currentColor */
  color?: string
  /** symbol id 前缀，默认 icon- */
  prefix?: string
  /** 线框模式：fill:none + stroke:currentColor */
  stroke?: boolean
  /** 是否旋转（适合 loading 图标） */
  spin?: boolean
  /** 提供后作为可访问名称，并移除 aria-hidden */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  prefix: 'icon-',
  stroke: false,
  spin: false,
  title: '',
})

const iconName = computed(() => `#${props.prefix}${props.iconClass}`)

const svgClass = computed(() => [
  props.className,
  { 'is-spin': props.spin, 'is-stroke': props.stroke },
])

const svgStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.size !== undefined && props.size !== '') {
    const size = typeof props.size === 'number' ? `${props.size}px` : props.size
    style.width = size
    style.height = size
  }
  if (props.color) style.color = props.color
  return style
})
</script>

<style scoped lang="scss">
.svg-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-icon.is-stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.svg-icon.is-spin {
  animation: svg-icon-spin 1s linear infinite;
}

@keyframes svg-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .svg-icon.is-spin {
    animation: none;
  }
}
</style>
