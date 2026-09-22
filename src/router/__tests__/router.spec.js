import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../../App.vue'
import HomeView from '../../views/HomeView.vue'

/** 路由表与 src/router/index.js 一致,只把 history 换成内存实现以便在测试里跑。 */
function testRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/about', name: 'about', component: () => import('../../views/AboutView.vue') },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../../views/NotFoundView.vue') },
    ],
  })
}

async function mountAt(path) {
  const router = testRouter()
  router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router] } })
}

describe('路由', () => {
  it('根路径渲染首页', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('计数器')
  })

  it('/about 懒加载关于页', async () => {
    const wrapper = await mountAt('/about')
    expect(wrapper.text()).toContain('关于')
    expect(wrapper.text()).toContain('懒加载')
  })

  it('未匹配路径落到 404 并回显原路径', async () => {
    const wrapper = await mountAt('/nope/deep')
    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('/nope/deep')
  })

  it('导航栏在当前路由上带 active 类', async () => {
    const wrapper = await mountAt('/about')
    const active = wrapper.findAll('.nav a').filter((link) => link.classes().includes('router-link-active'))
    expect(active.map((link) => link.text())).toContain('关于')
  })
})
