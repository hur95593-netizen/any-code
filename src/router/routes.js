import HomeView from '@/views/HomeView.vue'

// 路由表单独成文件,不绑定 history 实现:
// 应用用 web history(见 ./index.js),单元测试和 SSR 冒烟用 memory history,三处共用这一份。
export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/sort',
    name: 'sort',
    component: () => import('@/views/SortView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    // 懒加载:About 会被打包成单独的 chunk,首屏不必下载
    component: () => import('@/views/AboutView.vue'),
  },
  {
    // 兜底路由,未匹配的路径都到这里,不要让页面白屏
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]
