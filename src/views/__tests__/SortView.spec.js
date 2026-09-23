import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SortView from '../SortView.vue'

/** 按 DOM 顺序读出每个矩形的高度。 */
const heights = (wrapper) => wrapper.findAll('.bar').map((li) => Number(li.attributes('data-height')))
const isAscending = (list) => list.every((h, i) => i === 0 || list[i - 1] <= h)

/** 点按钮后在确认框里点「确定」,等同于用户完成一次操作。 */
async function clickAndConfirm(wrapper, name) {
  await wrapper.find(`[data-test="${name}"]`).trigger('click')
  await wrapper.find('[data-test="confirm-ok"]').trigger('click')
}

describe('SortView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始渲染 16 个高度互不相同的矩形,且为乱序', () => {
    const wrapper = mount(SortView)
    const list = heights(wrapper)

    expect(list).toHaveLength(16)
    expect(new Set(list).size).toBe(16)
    expect(isAscending(list)).toBe(false)
    expect(wrapper.find('.status').text()).toBe('乱序')
  })

  it('点击排序后按从小到大排列', async () => {
    const wrapper = mount(SortView)

    await clickAndConfirm(wrapper, 'sort')

    expect(isAscending(heights(wrapper))).toBe(true)
    expect(wrapper.find('.status').text()).toBe('已从小到大排好')
  })

  it('动画期间两个按钮都禁用,动画结束后恢复', async () => {
    const wrapper = mount(SortView)
    const sortBtn = wrapper.find('[data-test="sort"]')
    const resetBtn = wrapper.find('[data-test="reset"]')

    await clickAndConfirm(wrapper, 'sort')
    expect(sortBtn.attributes('disabled')).toBeDefined()
    expect(resetBtn.attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(600)
    // 已经排好序,排序按钮继续禁用;重置恢复可用
    expect(sortBtn.attributes('disabled')).toBeDefined()
    expect(resetBtn.attributes('disabled')).toBeUndefined()
  })

  it('点击重置后重新打乱,且只是换了顺序', async () => {
    const wrapper = mount(SortView)
    const before = [...heights(wrapper)].sort((a, b) => a - b)

    await clickAndConfirm(wrapper, 'sort')
    await vi.advanceTimersByTimeAsync(600)
    await clickAndConfirm(wrapper, 'reset')

    const after = heights(wrapper)
    expect(isAscending(after)).toBe(false)
    expect([...after].sort((a, b) => a - b)).toEqual(before)
    expect(wrapper.find('.status').text()).toBe('乱序')

    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.find('[data-test="sort"]').attributes('disabled')).toBeUndefined()
  })

  it('排序和重置期间矩形的 key 保持不变,动画才能按 FLIP 平移', async () => {
    // 不打桩 TransitionGroup,用真实组件渲染,确认列表挂在带过渡名的容器上
    const wrapper = mount(SortView, { global: { stubs: { TransitionGroup: false } } })
    const ul = wrapper.find('ul.bars')
    expect(ul.exists()).toBe(true)
    expect(ul.attributes('style')).toContain('--duration: 600ms')

    const firstBar = wrapper.find('.bar').element
    const heightOfFirst = firstBar.dataset.height

    await clickAndConfirm(wrapper, 'sort')

    // 同一个 DOM 节点被移动而不是销毁重建,这是位移动画成立的前提
    const same = wrapper.findAll('.bar').find((li) => li.attributes('data-height') === heightOfFirst)
    expect(same.element).toBe(firstBar)
  })

  it('点击排序先弹确认框,此时顺序不变;确定后才排序并关闭弹框', async () => {
    const wrapper = mount(SortView)
    const before = heights(wrapper)

    await wrapper.find('[data-test="sort"]').trigger('click')
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('确认排序')
    expect(heights(wrapper)).toEqual(before)

    await wrapper.find('[data-test="confirm-ok"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(isAscending(heights(wrapper))).toBe(true)
  })

  it('点击重置弹出的是重置的确认文案', async () => {
    const wrapper = mount(SortView)

    await wrapper.find('[data-test="reset"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').text()).toContain('确认重置')
  })

  it.each([
    ['点取消', (w) => w.find('[data-test="confirm-cancel"]').trigger('click')],
    ['点遮罩', (w) => w.find('[data-test="confirm-overlay"]').trigger('click')],
    ['按 Esc', (w) => w.find('[data-test="confirm-ok"]').trigger('keydown', { key: 'Escape' })],
  ])('%s 关闭弹框且不执行操作', async (_, dismiss) => {
    const wrapper = mount(SortView)
    const before = heights(wrapper)

    for (const name of ['sort', 'reset']) {
      await wrapper.find(`[data-test="${name}"]`).trigger('click')
      await dismiss(wrapper)
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(heights(wrapper)).toEqual(before)
      // 没有进入动画,按钮仍可用
      expect(wrapper.find(`[data-test="${name}"]`).attributes('disabled')).toBeUndefined()
    }
  })

  it('卸载时清掉动画定时器', async () => {
    const wrapper = mount(SortView)
    await clickAndConfirm(wrapper, 'sort')

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
