import type { StorybookConfig } from 'storybook'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const isVue = !!process.env.STORYBOOK_VUE

const config: StorybookConfig = {
  stories: isVue
    ? ['../stories/vue/**/*.stories.ts']
    : ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-vitest', '@storybook/addon-docs'],
  framework: isVue ? '@storybook/vue3-vite' : '@storybook/react-vite',
  viteFinal: async (configVite) => {
    const plugins = [tailwindcss()]

    if (isVue) {
      const vue = (await import('@vitejs/plugin-vue')).default
      plugins.push(vue())
    } else {
      const react = (await import('@vitejs/plugin-react')).default
      plugins.push(react())
    }

    return mergeConfig(configVite, {
      plugins,
      define: {
        __DEV__: true,
      },
    })
  },
}
export default config
