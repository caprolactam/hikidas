#!/usr/bin/env node
import { readFileSync, rmSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { rollup } from 'rollup'
import banner from 'rollup-plugin-banner2'
import pkg from './package.json' with { type: 'json' }

const external = (id) =>
  [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].some((d) => id.startsWith(d))

/**
 * @param {string} adapterName
 * @param {boolean} withTerser - whether to include Terser plugin
 * @returns {import('rollup').RollupOptions}
 */
function createBuildConfig(adapterName, withTerser) {
  const outputFile = withTerser
    ? `dist/.temp/${adapterName}-minified.js`
    : `dist/.temp/${adapterName}.js`

  return {
    input: `src/react/adapters/${adapterName}/index.ts`,
    output: {
      file: outputFile,
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      replace({
        __DEV__: false,
        preventAssignment: true,
      }),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        sourceMap: false,
      }),
      getBabelOutputPlugin({
        plugins: ['@babel/plugin-transform-react-pure-annotations'],
      }),
      ...(withTerser ? [terser()] : []),
      banner(() => '"use client";\n'),
    ],
    external,
  }
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
 * @param {number} original
 * @param {number} minified
 * @returns {string}
 */
function calculateReduction(original, minified) {
  const reduction = ((original - minified) / original) * 100
  return `${reduction.toFixed(1)}%`
}

/**
 * @param {string} adapterName
 */
async function measureBuildSize(adapterName) {
  console.log(`\n📦 Building ${adapterName} adapter...\n`)

  // build without Terser
  console.log('⏳ Building without minification...')
  const configWithoutTerser = createBuildConfig(adapterName, false)
  const bundleWithout = await rollup(configWithoutTerser)
  await bundleWithout.write(configWithoutTerser.output)
  await bundleWithout.close()
  const sizeWithout = getFileSize(configWithoutTerser.output.file)

  // build with Terser
  console.log('⏳ Building with Terser minification...')
  const configWithTerser = createBuildConfig(adapterName, true)
  const bundleWith = await rollup(configWithTerser)
  await bundleWith.write(configWithTerser.output)
  await bundleWith.close()
  const sizeWith = getFileSize(configWithTerser.output.file)

  console.log('\n📊 Build Size Comparison\n')
  console.log(
    '┌─────────────────────────────┬──────────────┬──────────────┬────────────┐',
  )
  console.log(
    '│ Configuration               │ Raw Size     │ Gzip Size    │ Reduction  │',
  )
  console.log(
    '├─────────────────────────────┼──────────────┼──────────────┼────────────┤',
  )
  console.log(
    `│ Without Terser              │ ${formatBytes(sizeWithout.raw).padEnd(12)} │ ${formatBytes(sizeWithout.gzip).padEnd(12)} │ -          │`,
  )
  console.log(
    `│ With Terser (passes: 5)     │ ${formatBytes(sizeWith.raw).padEnd(12)} │ ${formatBytes(sizeWith.gzip).padEnd(12)} │ ${calculateReduction(sizeWithout.raw, sizeWith.raw).padEnd(10)} │`,
  )
  console.log(
    '└─────────────────────────────┴──────────────┴──────────────┴────────────┘',
  )

  console.log('\n💡 Analysis:')
  console.log(
    `   • Terser reduces raw size by ${calculateReduction(sizeWithout.raw, sizeWith.raw)} (${formatBytes(sizeWithout.raw - sizeWith.raw)} saved)`,
  )
  console.log(
    `   • Terser reduces gzip size by ${calculateReduction(sizeWithout.gzip, sizeWith.gzip)} (${formatBytes(sizeWithout.gzip - sizeWith.gzip)} saved)`,
  )
  console.log(
    '\n📝 Note: Most modern bundlers (Vite, Next.js, etc.) will minify your',
  )
  console.log(
    '   application code, so library-level minification has limited impact.',
  )
  console.log('')

  rmSync('dist/.temp', { recursive: true })
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
