// 冒烟验收:把三个路由各渲染一遍,确认组件能挂载、路由能匹配、懒加载页面能取到。
// 用 Vite 的 SSR 加载器现场编译 .vue,不需要浏览器,离线可跑:npm run smoke
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createServer } from 'vite'

const cases = [
  { path: '/', expect: ['首页', '计数器', 'any-code'] },
  { path: '/about', expect: ['关于', '懒加载'] },
  { path: '/no-such-page', expect: ['404', '/no-such-page'] },
]

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})

// 路由表在这里重建一份:src/router 用的是 history 模式,Node 里没有 window,
// 换成 memory history 才能在服务端跑。路由规则本身与 src/router/index.js 保持一致。
const load = (path) => vite.ssrLoadModule(path).then((m) => m.default)

let failed = 0

try {
  const App = await load('/src/App.vue')
  const HomeView = await load('/src/views/HomeView.vue')

  for (const item of cases) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/about', name: 'about', component: () => load('/src/views/AboutView.vue') },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: () => load('/src/views/NotFoundView.vue') },
      ],
    })

    const app = createSSRApp(App).use(router)
    await router.push(item.path)
    await router.isReady()

    const html = await renderToString(app)
    const missing = item.expect.filter((text) => !html.includes(text))
    if (missing.length > 0) {
      console.error(`✗ ${item.path} 渲染结果缺少:${missing.join('、')}`)
      failed += 1
    } else {
      console.log(`✓ ${item.path} 渲染正常`)
    }
  }
} finally {
  await vite.close()
}

if (failed > 0) {
  console.error(`冒烟失败:${failed} 个路由不符合预期`)
  process.exit(1)
}

console.log('冒烟通过:3 个路由全部渲染正常')
