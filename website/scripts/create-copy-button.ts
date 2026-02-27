import type { Element as HElement } from 'hast'

/**
 * Creates a copy button element for code blocks
 * @param code - The code content to be copied
 * @returns HElement representing the copy button
 */
export function createCopyButton(code: string): HElement {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      className: ['code-copy-button'],
      'aria-label': 'コードをコピー',
      'data-code': code,
    },
    children: [
      {
        type: 'element',
        tagName: 'svg',
        properties: {
          className: ['copy-icon'],
          xmlns: 'http://www.w3.org/2000/svg',
          width: '16',
          height: '16',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        children: [
          {
            type: 'element',
            tagName: 'rect',
            properties: {
              width: '14',
              height: '14',
              x: '8',
              y: '8',
              rx: '2',
              ry: '2',
            },
            children: [],
          },
          {
            type: 'element',
            tagName: 'path',
            properties: {
              d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
            },
            children: [],
          },
        ],
      },
      {
        type: 'element',
        tagName: 'svg',
        properties: {
          className: ['check-icon'],
          xmlns: 'http://www.w3.org/2000/svg',
          width: '16',
          height: '16',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          style: 'display: none',
        },
        children: [
          {
            type: 'element',
            tagName: 'polyline',
            properties: {
              points: '20 6 9 17 4 12',
            },
            children: [],
          },
        ],
      },
    ],
  }
}
