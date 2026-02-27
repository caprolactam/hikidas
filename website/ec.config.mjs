import { defineEcConfig } from 'astro-expressive-code'
import { pluginCollapsible } from 'expressive-code-collapsible'

export default defineEcConfig({
  themes: ['github-light-default', 'github-dark-default'],
  styleOverrides: {
    uiFontFamily: 'var(--font-sans)',
    codeFontFamily: 'var(--font-mono)',
    frames: {
      frameBoxShadowCssValue: 'none',
    },
  },
  plugins: [
    pluginCollapsible({
      lineThreshold: 15,
      previewLines: 8,
      defaultCollapsed: true,
    }),
  ],
})
