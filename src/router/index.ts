import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 嵌套路由：
// /            -> index.vue（首页布局，含 <router-view> 出口）
//   /          -> home/index.vue（默认子路由）
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/views/index.vue'),
    children: [
      {
        path: '', // 默认子路由
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'canvas',
        name: 'canvas',
        component: () => import('@/views/canvas/index.vue'),
        meta: { title: '图表' },
      },
      {
        path: 'tablePage',
        name: 'tablePage',
        component: () => import('@/views/tablePage/index.vue'),
        meta: { title: '表格' },
      },
      {
        path: 'three',
        name: 'three',
        component: () => import('@/views/three/index.vue'),
        meta: { title: '模型' },
      },
      {
        path: 'svgPage',
        name: 'svgPage',
        component: () => import('@/views/svgPage/index.vue'),
        meta: { title: '图标' },
      },
    ],
  },
  // 兜底：未匹配重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由切换时同步页面标题
router.afterEach((to) => {
  const title = (to.meta.title as string) || '主题切换演示'
  document.title = `${title} · 主题切换演示`
})

export default router
