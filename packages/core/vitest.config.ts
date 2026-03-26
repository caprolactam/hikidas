import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    // src/global.d.ts
    __DEV__: true,
  },
  test: {
    include: ['./src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
    },
  },
})
