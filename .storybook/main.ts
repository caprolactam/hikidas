import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-vitest', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  viteFinal: (configVite) => {
    return mergeConfig(configVite, {
      plugins: [react(), tailwindcss()],
      define: {
        // src/global.d.ts
        __DEV__: true,
      },
    })
  },
}
export default config
