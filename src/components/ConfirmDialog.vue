<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '请确认',
  },
  message: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '确定',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmBtn = ref(null)
// 打开前的焦点所在(通常是触发按钮),关闭后还给它,键盘用户不会丢位置
let lastFocused = null

watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastFocused = document.activeElement
      await nextTick()
      confirmBtn.value?.focus()
    } else {
      lastFocused?.focus?.()
      lastFocused = null
    }
  },
)
</script>

<template>
  <div v-if="open" class="overlay" data-test="confirm-overlay" @click.self="emit('cancel')" @keydown.esc="emit('cancel')">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <h3 id="confirm-dialog-title">{{ title }}</h3>
      <p v-if="message" class="message">{{ message }}</p>
      <div class="actions">
        <button type="button" data-test="confirm-cancel" @click="emit('cancel')">{{ cancelText }}</button>
        <button ref="confirmBtn" type="button" class="primary" data-test="confirm-ok" @click="emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 40%);
}

.dialog {
  width: min(360px, 100%);
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  box-shadow: 0 10px 30px rgb(0 0 0 / 20%);
}

.dialog h3 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
}

.message {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.actions button {
  padding: 0.4rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.actions button.primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
</style>
