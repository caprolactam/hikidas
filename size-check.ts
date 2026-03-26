#!/usr/bin/env node
import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FRAMEWORKS: Record<string, FrameworkConfig> = {
  react: {
    peerFrameworkIds: ['react', 'react-dom'],
    adapters: {
      'radix-ui': {
        coreExports: [
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
        peerLibLabel: 'radix-ui',
        peerLibEntryCode: `import { Dialog } from 'radix-ui'\nexport { Dialog }\n`,
      },
      'base-ui': {
        coreExports: [
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
        peerLibLabel: '@base-ui/react',
        peerLibEntryCode: `import { Dialog } from '@base-ui/react/dialog'\nexport { Dialog }\n`,
      },
      headlessui: {
        coreExports: [
          'DrawerRoot',
          'DrawerBackdrop',
          'DrawerPanel',
          'DrawerTitle',
          'DrawerClose',
          'Drawer',
        ],
        peerLibLabel: '@headlessui/react',
        peerLibEntryCode: `import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, CloseButton } from '@headlessui/react'\nexport { Dialog, DialogBackdrop, DialogPanel, DialogTitle, CloseButton }\n`,
      },
    },
  },
  vue: {
    peerFrameworkIds: ['vue'],
    adapters: {
      'reka-ui': {
        coreExports: [
          'DrawerRoot',
          'DrawerPortal',
          'DrawerOverlay',
          'DrawerContent',
          'DrawerTrigger',
          'DrawerClose',
          'DrawerTitle',
          'DrawerDescription',
          'Drawer',
        ],
        peerLibLabel: 'reka-ui',
        peerLibEntryCode: `import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTrigger, DialogClose, DialogTitle, DialogDescription } from 'reka-ui'\nexport { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTrigger, DialogClose, DialogTitle, DialogDescription }\n`,
      },
    },
  },
}

type PackageJson = {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

type AdapterConfig = {
  coreExports: string[]
  peerLibLabel: string
  peerLibEntryCode: string
}

type FrameworkConfig = {
  peerFrameworkIds: string[]
  adapters: Record<string, AdapterConfig>
}

function makeExternalAll(pkg: PackageJson) {
  return (id: string) =>
    [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ].some((d) => id === d || id.startsWith(d + '/'))
}

function makeExternalFrameworkOnly(peerFrameworkIds: string[]) {
  return (id: string) =>
    peerFrameworkIds.some((d: string) => id === d || id.startsWith(d + '/'))
}

async function viteBuild(
  root: string,
  entry: string,
  outputName: string,
  { external }: { external: (id: string) => boolean },
) {
  await build({
    root,
    build: {
      lib: {
        entry: resolve(root, entry),
        formats: ['es'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: `${outputName}.js`,
        },
      },
      outDir: 'dist/.temp',
      minify: 'oxc',
      write: true,
      emptyOutDir: false,
      sourcemap: false,
    },
    logLevel: 'silent',
  })
  return getFileSize(resolve(root, `dist/.temp/${outputName}.js`))
}

function getFileSize(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const raw = Buffer.byteLength(content, 'utf-8')
  const gzip = gzipSync(content).length
  return { raw, gzip }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function formatDiff(bytes: number) {
  const sign = bytes >= 0 ? '+' : '-'
  return `${sign}${formatBytes(Math.abs(bytes))}`
}

function printTable(title: string, rows: [string, string, string][]) {
  const C1 = 31
  const C2 = 12
  const C3 = 12
  const sep = (l: string, m: string, r: string, f: string) =>
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

async function measureBuildSize(frameworkName: string, adapterName: string) {
  const framework = FRAMEWORKS[frameworkName]
  const adapter = framework.adapters[adapterName]
  const pkgDir = resolve(__dirname, `packages/${frameworkName}`)
  const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf-8'))

  const externalAll = makeExternalAll(pkg)
  const externalFrameworkOnly = makeExternalFrameworkOnly(
    framework.peerFrameworkIds,
  )

  console.log(`\n📦 Measuring ${frameworkName}/${adapterName} adapter...\n`)

  const tempDir = resolve(pkgDir, 'dist/.temp')
  const entriesDir = resolve(tempDir, 'entries')
  mkdirSync(entriesDir, { recursive: true })

  try {
    // Core entry: imports named exports (no NestingDrawerProvider) from source
    const coreEntryFile = `dist/.temp/entries/${adapterName}-core.js`
    writeFileSync(
      resolve(pkgDir, coreEntryFile),
      `export { ${adapter.coreExports.join(', ')} } from '../../../dist/${adapterName}/index.prod.js'\n`,
    )

    // Full entry: re-exports everything from source
    const fullEntryFile = `dist/.temp/entries/${adapterName}-full.js`
    writeFileSync(
      resolve(pkgDir, fullEntryFile),
      `export * from '../../../dist/${adapterName}/index.prod.js'\n`,
    )

    // Peer lib entry: imports directly from peer lib
    const peerLibEntryFile = `dist/.temp/entries/${adapterName}-peer-lib.js`
    writeFileSync(resolve(pkgDir, peerLibEntryFile), adapter.peerLibEntryCode)

    const peerLibLabel = adapter.peerLibLabel

    console.log('⏳ (1/4) hikidas core (no NestingDrawer)...')
    const coreSize = await viteBuild(
      pkgDir,
      coreEntryFile,
      `${adapterName}-core`,
      {
        external: externalAll,
      },
    )

    console.log('⏳ (2/4) hikidas full (with NestingDrawer)...')
    const fullSize = await viteBuild(
      pkgDir,
      fullEntryFile,
      `${adapterName}-full`,
      {
        external: externalAll,
      },
    )

    console.log(`⏳ (3/4) ${peerLibLabel} alone...`)
    const peerLibSize = await viteBuild(
      pkgDir,
      peerLibEntryFile,
      `${adapterName}-peer-lib`,
      { external: externalFrameworkOnly },
    )

    console.log(`⏳ (4/4) hikidas + ${peerLibLabel}...`)
    const totalSize = await viteBuild(
      pkgDir,
      fullEntryFile,
      `${adapterName}-total`,
      {
        external: externalFrameworkOnly,
      },
    )

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

const frameworkName = process.argv[2]
const adapterName = process.argv[3]

if (!frameworkName || !FRAMEWORKS[frameworkName]) {
  console.error(
    `❌ Invalid framework. Use one of: ${Object.keys(FRAMEWORKS).join(', ')}`,
  )
  process.exit(1)
}

const framework = FRAMEWORKS[frameworkName]
const validAdapters = Object.keys(framework.adapters)

if (!adapterName || !framework.adapters[adapterName]) {
  console.error(
    `❌ Invalid adapter for ${frameworkName}. Use one of: ${validAdapters.join(', ')}`,
  )
  process.exit(1)
}

measureBuildSize(frameworkName, adapterName).catch((err) => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
