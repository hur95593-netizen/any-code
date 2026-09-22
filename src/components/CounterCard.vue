<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '计数器',
  },
  step: {
    type: Number,
    default: 1,
  },
})

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value += props.step
}

function reset() {
  count.value = 0
}
</script>

<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <p class="value">{{ count }} <span class="muted">(两倍:{{ doubled }})</span></p>
    <div class="actions">
      <button type="button" @click="increment">加 {{ step }}</button>
      <button type="button" :disabled="count === 0" @click="reset">归零</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.card h3 {
  margin-top: 0;
}

.value {
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
