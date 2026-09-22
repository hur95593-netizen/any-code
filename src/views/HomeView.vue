<script setup>
import CounterCard from '@/components/CounterCard.vue'
</script>

<template>
  <section>
    <h2>首页</h2>
    <p>脚手架已就位:Vue 3 组合式 API、vue-router 4、Vite 构建。下面这个计数器用来验证响应式是否正常。</p>
    <CounterCard title="计数器" :step="2" />
  </section>
</template>
