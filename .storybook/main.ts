import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const isVue = !!process.env.STORYBOOK_VUE
const packagesDir = fileURLToPath(new URL('../packages', import.meta.url))

const config: StorybookConfig = {
  stories: isVue
    ? ['../stories/vue/**/*.stories.ts']
    : [
        '../stories/*.stories.tsx',
        '../stories/react/**/*.stories.tsx',
        '../stories/comparisons/**/*.stories.tsx',
      ],
  addons: ['@storybook/addon-vitest', '@storybook/addon-docs'],
  framework: isVue ? '@storybook/vue3-vite' : '@storybook/react-vite',
  viteFinal: async (configVite) => {
    const plugins = [tailwindcss()]

    if (isVue) {
      const vue = (await import('@vitejs/plugin-vue')).default
      plugins.push([vue()])
    } else {
      const react = (await import('@vitejs/plugin-react')).default
      plugins.push(react())
    }

    return mergeConfig(configVite, {
      plugins,
      define: {
        __DEV__: true,
      },
      resolve: {
        alias: [
          {
            find: /^@hikidas\/core$/,
            replacement: `${packagesDir}/core/src/index.ts`,
          },
          {
            find: /^@hikidas\/react\/(.+)$/,
            replacement: `${packagesDir}/react/src/adapters/$1/index.ts`,
          },
          {
            find: /^@hikidas\/vue\/(.+)$/,
            replacement: `${packagesDir}/vue/src/adapters/$1/index.ts`,
          },
        ],
      },
    })
  },
  ...(process.env.STORYBOOK_DEPLOY && {
    refs: {
      vue: {
        title: 'Vue',
        url: '/hikidas/vue',
      },
    },
  }),
}
export default config
