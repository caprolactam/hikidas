import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import { rehypeCodeHighlight } from './scripts/custom-syntax-highlighter.ts'

export default defineConfig({
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [react(), mdx()],
  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
  },
  markdown: {
    // do it manually
    syntaxHighlight: false,
    remarkRehype: {
      footnoteLabel: '脚注',
      footnoteLabelProperties: { className: undefined },
      footnoteBackLabel: (referenceIndex, _rereferenceIndex) =>
        `参照${referenceIndex + 1}に戻る`,
    },
    rehypePlugins: [
      rehypeCodeHighlight,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          headingProperties: {
            'data-link-heading': '',
          },
          properties: {
            title: 'このセクションのURL',
            tabIndex: -1,
            ariaHidden: 'true',
          },
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
