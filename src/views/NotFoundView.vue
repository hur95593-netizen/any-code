<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section>
    <h2>404</h2>
    <p>没有这个页面:<code>{{ route.fullPath }}</code></p>
    <RouterLink to="/">回首页</RouterLink>
  </section>
</template>
