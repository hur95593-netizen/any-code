import { fileURLToPath } from 'node:url'

import { mergeConfig, defineConfig } from 'vitest/config'

import viteConfig from './vite.config.js'

// 复用 vite.config.js 里的插件和别名,测试与构建保持同一套解析规则
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['src/**/__tests__/*.spec.js'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
