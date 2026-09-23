<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { createBars, isSorted, shuffleBars, sortBars } from '@/utils/bars'

const BAR_COUNT = 16
// 动画时长,样式里通过 --duration 读取同一个值,两边不会对不上
const DURATION = 600

const bars = ref(createBars(BAR_COUNT))
const animating = ref(false)
const sorted = computed(() => isSorted(bars.value))

let timer = null

// 只替换数组顺序,矩形的 key 不变:TransitionGroup 会用 FLIP 把每个矩形从旧位置平移到新位置
function play(next) {
  bars.value = next
  animating.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    animating.value = false
  }, DURATION)
}

// 两个按钮都先弹框确认,点「确定」才真正执行
const ACTIONS = {
  sort: {
    title: '确认排序',
    message: '将把矩形按高度从小到大排列。',
    run: () => play(sortBars(bars.value)),
  },
  reset: {
    title: '确认重置',
    message: '将重新随机打乱矩形的顺序。',
    run: () => play(shuffleBars(bars.value)),
  },
}

// 正在等待确认的操作:'sort' | 'reset' | null
const pending = ref(null)
const pendingAction = computed(() => (pending.value ? ACTIONS[pending.value] : null))

function ask(name) {
  pending.value = name
}

function onConfirm() {
  const action = pendingAction.value
  pending.value = null
  action?.run()
}

function onCancel() {
  pending.value = null
}

onBeforeUnmount(() => clearTimeout(timer))

// 高度映射到色相:矮的偏蓝、高的偏绿,排好序后能看出渐变
function barStyle(bar) {
  return {
    height: `${bar.height}%`,
    backgroundColor: `hsl(${220 - bar.height * 0.9} 60% 55%)`,
  }
}
</script>

<template>
  <section class="sort-view">
    <h2>排序演示</h2>

    <div class="toolbar">
      <button type="button" data-test="sort" :disabled="animating || sorted" @click="ask('sort')">排序</button>
      <button type="button" data-test="reset" :disabled="animating" @click="ask('reset')">重置</button>
      <span class="status" aria-live="polite">{{ sorted ? '已从小到大排好' : '乱序' }}</span>
    </div>

    <TransitionGroup tag="ul" name="bar" class="bars" :style="{ '--duration': `${DURATION}ms` }">
      <li
        v-for="bar in bars"
        :key="bar.id"
        class="bar"
        :style="barStyle(bar)"
        :data-height="bar.height"
        :aria-label="`高度 ${bar.height}`"
      />
    </TransitionGroup>

    <ConfirmDialog
      :open="pending !== null"
      :title="pendingAction?.title"
      :message="pendingAction?.message"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toolbar button {
  padding: 0.4rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.toolbar button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.toolbar button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.status {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 260px;
  margin: 0;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  list-style: none;
}

.bar {
  flex: 1;
  min-width: 8px;
  border-radius: 3px 3px 0 0;
}

/* TransitionGroup 的位移动画:排序和重置都走这一条 */
.bar-move {
  transition: transform var(--duration) cubic-bezier(0.55, 0, 0.1, 1);
}

@media (prefers-reduced-motion: reduce) {
  .bar-move {
    transition-duration: 1ms;
  }
}
</style>
