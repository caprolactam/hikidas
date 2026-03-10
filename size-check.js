#!/usr/bin/env node
import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import pkg from './package.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

// Exclude all peer deps (hikidas-only builds)
const externalAll = (id) =>
  [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].some((d) => id === d || id.startsWith(d + '/'))

// Exclude only react/react-dom (peer-lib-bundled builds)
const externalReactOnly = (id) =>
  ['react', 'react-dom'].some((d) => id === d || id.startsWith(d + '/'))

// Named exports per adapter excluding NestingDrawerProvider
const CORE_EXPORTS = {
  'radix-ui': [
    'DrawerRoot',
    'DrawerOverlay',
    'DrawerContent',
    'DrawerTrigger',
    'DrawerPortal',
    'DrawerClose',
    'DrawerTitle',
    'DrawerDescription',
    'Drawer',
  ],
  'base-ui': [
    'DrawerRoot',
    'DrawerBackdrop',
    'DrawerPopup',
    'DrawerTrigger',
    'DrawerPortal',
    'DrawerViewport',
    'DrawerTitle',
    'DrawerDescription',
    'DrawerClose',
    'Drawer',
  ],
  headlessui: [
    'DrawerRoot',
    'DrawerBackdrop',
    'DrawerPanel',
    'DrawerTitle',
    'DrawerClose',
    'Drawer',
  ],
}

// Synthetic entry that imports only what the adapter uses from its peer lib
const PEER_LIB_ENTRY_CODE = {
  'radix-ui': `import { Dialog } from 'radix-ui'\nexport { Dialog }\n`,
  'base-ui': `import { Dialog } from '@base-ui/react/dialog'\nexport { Dialog }\n`,
  headlessui: `import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, CloseButton } from '@headlessui/react'\nexport { Dialog, DialogBackdrop, DialogPanel, DialogTitle, CloseButton }\n`,
}

const PEER_LIB_LABEL = {
  'radix-ui': 'radix-ui',
  'base-ui': '@base-ui/react',
  headlessui: '@headlessui/react',
}

/**
 * @param {string} entry - relative path from project root
 * @param {string} outputName - output filename without extension
 * @param {{ external: (id: string) => boolean }} options
 * @returns {Promise<{ raw: number, gzip: number }>}
 */
async function viteBuild(entry, outputName, { external }) {
  await build({
    root: __dirname,
    build: {
      lib: {
        entry: resolve(__dirname, entry),
        formats: ['es'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: `${outputName}.js`,
        },
      },
      outDir: 'dist/.temp',
      // TODO: this will be replaced with oxc in Vite v8.
      minify: 'terser',
      write: true,
      emptyOutDir: false,
      sourcemap: false,
    },
    logLevel: 'silent',
  })
  return getFileSize(`dist/.temp/${outputName}.js`)
}

/**
 * @param {string} filePath
 * @returns {{ raw: number, gzip: number }}
 */
function getFileSize(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const raw = Buffer.byteLength(content, 'utf-8')
  const gzip = gzipSync(content).length
  return { raw, gzip }
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatDiff(bytes) {
  const sign = bytes >= 0 ? '+' : '-'
  return `${sign}${formatBytes(Math.abs(bytes))}`
}

/**
 * @param {string} title
 * @param {[string, string, string][]} rows
 */
function printTable(title, rows) {
  const C1 = 31
  const C2 = 12
  const C3 = 12
  const sep = (l, m, r, f) =>
    l + f.repeat(C1 + 2) + m + f.repeat(C2 + 2) + m + f.repeat(C3 + 2) + r

  console.log(`\n${title}`)
  console.log(sep('┌', '┬', '┐', '─'))
  console.log(
    `│ ${''.padEnd(C1)} │ ${'Raw'.padEnd(C2)} │ ${'Gzip'.padEnd(C3)} │`,
  )
  console.log(sep('├', '┼', '┤', '─'))
  for (const [label, raw, gzip] of rows) {
    console.log(
      `│ ${label.padEnd(C1)} │ ${raw.padEnd(C2)} │ ${gzip.padEnd(C3)} │`,
    )
  }
  console.log(sep('└', '┴', '┘', '─'))
}

/**
 * @param {string} adapterName
 */
async function measureBuildSize(adapterName) {
  console.log(`\n📦 Measuring ${adapterName} adapter...\n`)

  const tempDir = 'dist/.temp'
  const entriesDir = `${tempDir}/entries`
  mkdirSync(entriesDir, { recursive: true })

  try {
    // Core entry: imports named exports (no NestingDrawerProvider) from source
    const coreEntryFile = `${entriesDir}/${adapterName}-core.js`
    writeFileSync(
      coreEntryFile,
      `export { ${CORE_EXPORTS[adapterName].join(', ')} } from '../../../dist/${adapterName}/index.prod.js'\n`,
    )

    // Full entry: re-exports everything from source
    const fullEntryFile = `${entriesDir}/${adapterName}-full.js`
    writeFileSync(
      fullEntryFile,
      `export * from '../../../dist/${adapterName}/index.prod.js'\n`,
    )

    // Peer lib entry: imports directly from peer lib
    const peerLibEntryFile = `${entriesDir}/${adapterName}-peer-lib.js`
    writeFileSync(peerLibEntryFile, PEER_LIB_ENTRY_CODE[adapterName])

    const peerLibLabel = PEER_LIB_LABEL[adapterName]

    console.log('⏳ (1/4) hikidas core (no NestingDrawer)...')
    const coreSize = await viteBuild(coreEntryFile, `${adapterName}-core`, {
      external: externalAll,
    })

    console.log('⏳ (2/4) hikidas full (with NestingDrawer)...')
    const fullSize = await viteBuild(fullEntryFile, `${adapterName}-full`, {
      external: externalAll,
    })

    console.log(`⏳ (3/4) ${peerLibLabel} alone...`)
    const peerLibSize = await viteBuild(
      peerLibEntryFile,
      `${adapterName}-peer-lib`,
      { external: externalReactOnly },
    )

    console.log(`⏳ (4/4) hikidas + ${peerLibLabel}...`)
    const totalSize = await viteBuild(fullEntryFile, `${adapterName}-total`, {
      external: externalReactOnly,
    })

    const nestingRaw = fullSize.raw - coreSize.raw
    const nestingGzip = fullSize.gzip - coreSize.gzip
    const hikidasAddsRaw = totalSize.raw - peerLibSize.raw
    const hikidasAddsGzip = totalSize.gzip - peerLibSize.gzip

    printTable('🌳 Tree-shaking (hikidas only, minified + gzip)', [
      [
        'Core (no NestingDrawer)',
        formatBytes(coreSize.raw),
        formatBytes(coreSize.gzip),
      ],
      [
        'Full (+ NestingDrawer)',
        formatBytes(fullSize.raw),
        formatBytes(fullSize.gzip),
      ],
      [
        '  NestingDrawer overhead',
        formatDiff(nestingRaw),
        formatDiff(nestingGzip),
      ],
    ])

    printTable(`📐 With ${peerLibLabel} bundled (minified + gzip)`, [
      [
        `${peerLibLabel} alone`,
        formatBytes(peerLibSize.raw),
        formatBytes(peerLibSize.gzip),
      ],
      [
        `hikidas + ${peerLibLabel}`,
        formatBytes(totalSize.raw),
        formatBytes(totalSize.gzip),
      ],
      [
        '  hikidas adds',
        formatDiff(hikidasAddsRaw),
        formatDiff(hikidasAddsGzip),
      ],
    ])

    console.log('')
  } finally {
    rmSync(tempDir, { recursive: true })
  }
}

const adapterName = process.argv[2] || 'radix-ui'

if (!['base-ui', 'radix-ui', 'headlessui'].includes(adapterName)) {
  console.error(
    '❌ Invalid adapter name. Use "base-ui", "radix-ui", or "headlessui".',
  )
  process.exit(1)
}

measureBuildSize(adapterName).catch((err) => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
