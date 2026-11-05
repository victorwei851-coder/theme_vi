<script setup lang="ts">
// 首页布局：作为嵌套路由的父级组件
// 自身只负责外壳，真正的页面内容由内部 <router-view> 渲染子路由（默认 home/index.vue）
</script>

<template>
  <div class="index-layout">
    <router-view />
  </div>
</template>

<style scoped>
.index-layout {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
