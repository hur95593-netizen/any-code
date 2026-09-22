import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CounterCard from '../CounterCard.vue'

describe('CounterCard', () => {
  it('渲染标题与初始值', () => {
    const wrapper = mount(CounterCard, { props: { title: '订单数' } })

    expect(wrapper.find('h3').text()).toBe('订单数')
    expect(wrapper.find('.value').text()).toContain('0')
    expect(wrapper.find('.muted').text()).toContain('两倍:0')
  })

  it('点击按步长累加,并同步计算属性', async () => {
    const wrapper = mount(CounterCard, { props: { step: 3 } })
    const [increment] = wrapper.findAll('button')

    await increment.trigger('click')
    await increment.trigger('click')

    expect(wrapper.find('.value').text()).toContain('6')
    expect(wrapper.find('.muted').text()).toContain('两倍:12')
  })

  it('归零按钮在计数为 0 时禁用,累加后可用', async () => {
    const wrapper = mount(CounterCard)
    const [increment, reset] = wrapper.findAll('button')

    expect(reset.attributes('disabled')).toBeDefined()

    await increment.trigger('click')
    expect(reset.attributes('disabled')).toBeUndefined()

    await reset.trigger('click')
    expect(wrapper.find('.value').text()).toContain('0')
    expect(reset.attributes('disabled')).toBeDefined()
  })

  it('step 默认为 1', async () => {
    const wrapper = mount(CounterCard)
    const [increment] = wrapper.findAll('button')

    expect(increment.text()).toBe('加 1')
    await increment.trigger('click')
    expect(wrapper.find('.value').text()).toContain('1')
  })
})
