import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../../App.vue'
import { routes } from '../routes.js'

/** 用与应用同一份路由表,只把 history 换成内存实现以便在测试里跑。 */
async function mountAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
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

  it('/sort 懒加载排序演示页', async () => {
    const wrapper = await mountAt('/sort')
    expect(wrapper.find('h2').text()).toBe('排序演示')
    expect(wrapper.findAll('.bar')).toHaveLength(16)
    expect(wrapper.find('[data-test="sort"]').text()).toBe('排序')
    expect(wrapper.find('[data-test="reset"]').text()).toBe('重置')
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
    const active = async (path) => {
      const wrapper = await mountAt(path)
      return wrapper
        .findAll('.nav a')
        .filter((link) => link.classes().includes('router-link-active'))
        .map((link) => link.text())
    }
    expect(await active('/about')).toEqual(['关于'])
    expect(await active('/sort')).toEqual(['排序演示'])
  })
})
