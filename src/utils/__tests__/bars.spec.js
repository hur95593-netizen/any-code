import { describe, expect, it, vi } from 'vitest'

import { createBars, isSorted, shuffleBars, sortBars } from '../bars.js'

/** 可复现的伪随机数(mulberry32),让随机相关的断言每次结果一致。 */
function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ids = (bars) => bars.map((bar) => bar.id)
const heights = (bars) => bars.map((bar) => bar.height)

describe('createBars', () => {
  it('生成指定数量、高度两两不同且落在区间内的矩形', () => {
    const bars = createBars(16, { min: 12, max: 100, random: seeded(1) })

    expect(bars).toHaveLength(16)
    expect(new Set(heights(bars)).size).toBe(16)
    for (const h of heights(bars)) {
      expect(h).toBeGreaterThanOrEqual(12)
      expect(h).toBeLessThanOrEqual(100)
    }
    expect(new Set(ids(bars)).size).toBe(16)
  })

  it('默认就是乱序', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(isSorted(createBars(16, { random: seeded(seed) }))).toBe(false)
    }
  })

  it('随机源恰好给出有序结果时也会被打乱', () => {
    // random 恒为 0.999... 时 Fisher–Yates 每步都与自身交换,候选池保持升序
    const bars = createBars(5, { min: 1, max: 5, random: () => 0.9999 })
    expect(isSorted(bars)).toBe(false)
  })

  it('区间放不下这么多互不相同的高度时报错', () => {
    expect(() => createBars(10, { min: 1, max: 5 })).toThrow(RangeError)
  })
})

describe('sortBars', () => {
  it('按高度从小到大排列,不改写入参', () => {
    const bars = [
      { id: 0, height: 50 },
      { id: 1, height: 20 },
      { id: 2, height: 80 },
      { id: 3, height: 35 },
    ]
    const snapshot = structuredClone(bars)

    const sorted = sortBars(bars)

    expect(heights(sorted)).toEqual([20, 35, 50, 80])
    expect(ids(sorted)).toEqual([1, 3, 0, 2])
    expect(bars).toEqual(snapshot)
  })

  it('对已排序的数组幂等', () => {
    const bars = sortBars(createBars(16, { random: seeded(7) }))
    expect(sortBars(bars)).toEqual(bars)
  })

  it('随机输入与参照排序结果一致(含重复高度、不同长度)', () => {
    const random = seeded(13)
    for (let round = 0; round < 300; round++) {
      const length = Math.floor(random() * 40)
      // 高度只取 1..10,长数组里必然有重复,覆盖分区时等于基准的分支
      const bars = Array.from({ length }, (_, id) => ({ id, height: 1 + Math.floor(random() * 10) }))

      const sorted = sortBars(bars)

      expect(heights(sorted)).toEqual(heights(bars).sort((a, b) => a - b))
      expect([...ids(sorted)].sort((a, b) => a - b)).toEqual(ids(bars))
    }
  })

  it('逆序、全相同、空数组与单元素', () => {
    const reversed = Array.from({ length: 50 }, (_, id) => ({ id, height: 50 - id }))
    expect(heights(sortBars(reversed))).toEqual(Array.from({ length: 50 }, (_, i) => i + 1))

    const same = Array.from({ length: 8 }, (_, id) => ({ id, height: 30 }))
    expect(heights(sortBars(same))).toEqual(Array(8).fill(30))

    const one = [{ id: 0, height: 10 }]
    expect(sortBars([])).toEqual([])
    expect(sortBars(one)).toEqual(one)
    expect(sortBars(one)).not.toBe(one)
  })

  it('不借助 Array.prototype.sort', () => {
    const spy = vi.spyOn(Array.prototype, 'sort')
    try {
      sortBars(createBars(16, { random: seeded(21) }))
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})

describe('shuffleBars', () => {
  it('结果是原数组的一个排列,不改写入参', () => {
    const bars = createBars(16, { random: seeded(3) })
    const snapshot = structuredClone(bars)

    const shuffled = shuffleBars(bars, seeded(4))

    expect([...ids(shuffled)].sort((a, b) => a - b)).toEqual([...ids(bars)].sort((a, b) => a - b))
    expect(bars).toEqual(snapshot)
  })

  it('打乱已排序的数组,结果一定不是有序状态', () => {
    const sorted = sortBars(createBars(16, { random: seeded(5) }))
    for (let seed = 0; seed < 200; seed++) {
      expect(isSorted(shuffleBars(sorted, seeded(seed)))).toBe(false)
    }
  })

  it('打乱乱序数组,顺序一定发生变化', () => {
    const bars = createBars(16, { random: seeded(9) })
    for (let seed = 0; seed < 200; seed++) {
      expect(ids(shuffleBars(bars, seeded(seed)))).not.toEqual(ids(bars))
    }
  })

  it('随机源失效时退化为反转,仍保证顺序改变', () => {
    const sorted = sortBars(createBars(6, { random: seeded(11) }))
    // 恒为 0.9999 时洗牌不产生任何交换
    const result = shuffleBars(sorted, () => 0.9999)
    expect(ids(result)).toEqual(ids(sorted).reverse())
  })

  it('空数组与单元素原样返回副本', () => {
    const one = [{ id: 0, height: 10 }]
    expect(shuffleBars([])).toEqual([])
    expect(shuffleBars(one)).toEqual(one)
    expect(shuffleBars(one)).not.toBe(one)
  })
})

describe('isSorted', () => {
  it('空数组和单元素视为有序', () => {
    expect(isSorted([])).toBe(true)
    expect(isSorted([{ id: 0, height: 1 }])).toBe(true)
  })
})
