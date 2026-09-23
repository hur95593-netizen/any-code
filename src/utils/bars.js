// 排序演示页的纯逻辑:生成矩形、打乱、排序。
// 全部不改写入参,随机源可注入,方便测试写出确定的断言。

/** 打乱时最多重试的次数,防止随机源极端情况下死循环。 */
const MAX_SHUFFLE_ATTEMPTS = 20

/**
 * 生成 count 个高度两两不同的矩形,默认就是乱序。
 * 高度取自 [min, max] 的整数,单位是容器高度的百分比。
 *
 * @returns {{ id: number, height: number }[]}
 */
export function createBars(count, { min = 12, max = 100, random = Math.random } = {}) {
  if (max - min + 1 < count) {
    throw new RangeError(`高度区间 [${min}, ${max}] 不够容纳 ${count} 个互不相同的高度`)
  }
  // 候选高度无放回抽样,保证「高度不一致」
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  fisherYates(pool, random)
  const bars = pool.slice(0, count).map((height, id) => ({ id, height }))
  return isSorted(bars) ? shuffleBars(bars, random) : bars
}

/**
 * 返回打乱后的新数组。两个及以上元素时保证结果与原顺序不同,
 * 三个及以上元素时还保证结果不是已排序状态——否则点「重置」看起来像没反应。
 */
export function shuffleBars(bars, random = Math.random) {
  let next = bars.slice()
  if (bars.length < 2) {
    return next
  }
  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt++) {
    next = bars.slice()
    fisherYates(next, random)
    const changed = next.some((bar, i) => bar.id !== bars[i].id)
    if (changed && (bars.length < 3 || !isSorted(next))) {
      return next
    }
  }
  // 随机源连续多次给出同一结果时退而求其次:整体反转,至少保证顺序变了
  return bars.slice().reverse()
}

/** 按高度从小到大排序,返回新数组。 */
export function sortBars(bars) {
  return bars.slice().sort((a, b) => a.height - b.height)
}

/** 是否已按高度从小到大排好。 */
export function isSorted(bars) {
  return bars.every((bar, i) => i === 0 || bars[i - 1].height <= bar.height)
}

/** 原地 Fisher–Yates 洗牌,每种排列等概率。 */
function fisherYates(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}
