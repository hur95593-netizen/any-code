<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <h1 class="logo">any-code</h1>
    <nav class="nav">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/about">关于</RouterLink>
    </nav>
  </header>

  <main class="site-main">
    <RouterView />
  </main>

  <footer class="site-footer">Vue 3 + Vite 单页面应用</footer>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.logo {
  margin: 0;
  font-size: 1.25rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav a {
  color: var(--color-text-muted);
  text-decoration: none;
}

.nav a:hover,
.nav a.router-link-active {
  color: var(--color-primary);
}

.site-main {
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.site-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
}
</style>
