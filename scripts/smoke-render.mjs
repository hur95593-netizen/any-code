// 冒烟验收:把每个路由各渲染一遍,确认组件能挂载、路由能匹配、懒加载页面能取到。
// 用 Vite 的 SSR 加载器现场编译 .vue,不需要浏览器,离线可跑:npm run smoke
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createServer } from 'vite'

const cases = [
  { path: '/', expect: ['首页', '计数器', 'any-code'] },
  { path: '/sort', expect: ['排序演示', '排序', '重置', 'class="bar"'] },
  { path: '/about', expect: ['关于', '懒加载'] },
  { path: '/no-such-page', expect: ['404', '/no-such-page'] },
]

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})

let failed = 0

try {
  const { default: App } = await vite.ssrLoadModule('/src/App.vue')
  // 与应用共用同一份路由表;src/router/index.js 用的是 web history,Node 里没有 window,
  // 所以这里只取路由规则,history 换成内存实现
  const { routes } = await vite.ssrLoadModule('/src/router/routes.js')

  for (const item of cases) {
    const router = createRouter({ history: createMemoryHistory(), routes })

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

console.log(`冒烟通过:${cases.length} 个路由全部渲染正常`)
