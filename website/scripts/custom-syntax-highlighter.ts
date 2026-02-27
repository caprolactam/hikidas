/*!
 * Adapted from
 * - ggoodman/nostalgie
 *   - MIT https://github.com/ggoodman/nostalgie/blob/45f3f6356684287a214dab667064ec9776def933/LICENSE
 *   - https://github.com/ggoodman/nostalgie/blob/45f3f6356684287a214dab667064ec9776def933/src/worker/mdxCompiler.ts
 * - timlrx/rehype-prism-plus
 *   - MIT https://github.com/timlrx/rehype-prism-plus/blob/main/LICENSE
 *   - https://github.com/timlrx/rehype-prism-plus/blob/main/src/generator.js
 */
import { htmlEscape } from 'escape-goat'
import type { Element as HElement, Root as HRoot } from 'hast'
import { toString } from 'hast-util-to-string'
import rangeParser from 'parse-numeric-range'
import { codeToHast } from 'shiki'
import { visit } from 'unist-util-visit'
import { createCopyButton } from './create-copy-button.ts'

function isArrayOfStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function parseLineRange(param: string | null) {
  if (!param) return []
  return rangeParser(param)
}

type Info = {
  filename: string | null
  addedLines: number[]
  removedLines: number[]
  highlightLines: number[]
  startingLineNumber: number
  language: string
}
/**
 * @example ```js add=1,3 remove=2,4-6 start=5 lines=1-3,5```のように書かれたマークダウンを親に持つ`<code>`のhastをパースしてオブジェクトに変換する
 */
function parseElementInfo(node: HElement): Info | null {
  // meta can be in node.data.meta (remark) or node.properties.metastring (rehype)
  const meta =
    (node.data?.meta as string | undefined) ??
    (node.properties?.metastring as string | undefined) ??
    ''
  if (typeof meta !== 'string') return null

  const className = node.properties?.className
  if (!isArrayOfStrings(className)) return null

  const encodedMeta =
    decodeURIComponent(meta) !== meta
      ? meta.split(/\s+/).join('&')
      : meta
          .split(/\s+/)
          .map((component) => {
            const [key, value] = component.split('=')
            return `${key}=${value ? encodeURIComponent(value) : ''}`
          })
          .join('&')
  const metaParams = new URLSearchParams(encodedMeta)

  const filename = metaParams.get('filename')
  const addedLines = parseLineRange(metaParams.get('add'))
  const removedLines = parseLineRange(metaParams.get('remove'))
  const highlightLines = parseLineRange(metaParams.get('lines'))
  const startValNum = metaParams.has('start')
    ? Number(metaParams.get('start'))
    : 1
  const startingLineNumber = Number.isFinite(startValNum) ? startValNum : 1

  let language = className
    .find((c) => c.startsWith('language-'))
    ?.slice('language-'.length)

  if (language?.includes('diff-')) {
    language = language.split('-')[1]
  }

  return {
    filename,
    addedLines,
    removedLines,
    highlightLines,
    startingLineNumber,
    language: language ?? 'txt',
  }
}

export function rehypeCodeHighlight() {
  return async (tree: HRoot) => {
    const nodesToTokenize: Array<
      {
        parent: HElement
        node: HElement
      } & Info
    > = []

    visit(tree, 'element', (node, _index, parent) => {
      // @ts-expect-error
      if (!parent || parent.tagName !== 'pre' || !parent.children) return
      if (!node || node.tagName !== 'code' || !node.children) return

      const info = parseElementInfo(node)

      if (!info) return

      // @ts-expect-error
      nodesToTokenize.push({ parent, node, ...info })
    })

    for (const {
      node,
      parent,
      filename,
      addedLines,
      removedLines,
      highlightLines,
      startingLineNumber,
      language,
    } of nodesToTokenize) {
      let highlighted = await codeToHast(
        // 最後の行に空のspanが生成されるを防ぐ
        toString(node).trimEnd(),
        {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          lang: language,
          transformers: [
            {
              // shiki add tabindex=0 to <pre> for WCAG 2.1, so don't remove it
              // https://github.com/shikijs/shiki/pull/429
              pre(node) {
                if (addedLines.length || removedLines.length) {
                  node.properties['data-diff'] = true
                }
                if (filename) {
                  node.properties['data-filename'] = filename
                }
              },
              line(node, line) {
                node.properties['data-line-number'] =
                  line + startingLineNumber - 1

                if (highlightLines.includes(line)) {
                  node.properties['data-highlight'] = true
                }

                if (addedLines.length || removedLines.length) {
                  if (addedLines.includes(line)) {
                    node.properties['data-inserted'] = true
                  } else if (removedLines.includes(line)) {
                    node.properties['data-deleted'] = true
                  }
                }
              },
            },
          ],
        },
      )

      const pre = highlighted.children[0]
      const copyButton = createCopyButton(toString(node).trimEnd())

      Object.assign(parent, {
        type: 'element',
        tagName: 'div',
        properties: {
          dataLang: htmlEscape(language),
          className: ['md-prose'],
        },
        children: [pre, copyButton],
      })
    }
  }
}
