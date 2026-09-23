import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ConfirmDialog from '../ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('open 为 false 时不渲染', () => {
    wrapper = mount(ConfirmDialog, { props: { open: false } })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('渲染标题、说明和按钮文案,并声明为模态对话框', () => {
    wrapper = mount(ConfirmDialog, {
      props: { open: true, title: '确认排序', message: '将按高度排列。', confirmText: '排', cancelText: '算了' },
    })
    const dialog = wrapper.find('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.find('h3').text()).toBe('确认排序')
    expect(dialog.find('.message').text()).toBe('将按高度排列。')
    expect(wrapper.find('[data-test="confirm-ok"]').text()).toBe('排')
    expect(wrapper.find('[data-test="confirm-cancel"]').text()).toBe('算了')
  })

  it('确定发出 confirm;取消、点遮罩、按 Esc 发出 cancel', async () => {
    wrapper = mount(ConfirmDialog, { props: { open: true } })

    await wrapper.find('[data-test="confirm-ok"]').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)

    await wrapper.find('[data-test="confirm-cancel"]').trigger('click')
    await wrapper.find('[data-test="confirm-overlay"]').trigger('click')
    await wrapper.find('[data-test="confirm-ok"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(3)
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('点弹框内部不算点遮罩', async () => {
    wrapper = mount(ConfirmDialog, { props: { open: true } })

    await wrapper.find('[role="dialog"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('打开时聚焦「确定」,关闭后焦点还给打开前的元素', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    wrapper = mount(ConfirmDialog, { props: { open: false }, attachTo: document.body })
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('[data-test="confirm-ok"]').element)

    await wrapper.setProps({ open: false })
    expect(document.activeElement).toBe(trigger)
  })
})
