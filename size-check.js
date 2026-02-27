#!/usr/bin/env node
import { readFileSync, rmSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
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
 * Rollup設定を生成
 * @param {string} adapterName - アダプター名
 * @param {boolean} withTerser - Terserを使用するか
 * @returns {import('rollup').RollupOptions}
 */
function createBuildConfig(adapterName, withTerser) {
  const outputFile = withTerser
    ? `dist/.temp/${adapterName}-minified.js`
    : `dist/.temp/${adapterName}.js`

  return {
    input: `src/adapters/${adapterName}/index.ts`,
    output: {
      file: outputFile,
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false, // 型定義は不要
        sourceMap: false,
      }),
      getBabelOutputPlugin({
        plugins: ['@babel/plugin-transform-react-pure-annotations'],
      }),
      ...(withTerser
        ? [
            terser({
              ecma: 2020,
              module: true,
              compress: {
                passes: 5,
                unsafe: true,
                keep_fargs: false,
              },
              mangle: {
                properties: true,
              },
              format: {
                preserve_annotations: true,
              },
            }),
          ]
        : []),
      banner(() => '"use client";\n'),
    ],
    external,
  }
}

/**
 * ファイルサイズを取得
 * @param {string} filePath - ファイルパス
 * @returns {{ raw: number, gzip: number }}
 */
function getFileSize(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const raw = Buffer.byteLength(content, 'utf-8')
  const gzip = gzipSync(content).length
  return { raw, gzip }
}

/**
 * バイト数を人間が読める形式に変換
 * @param {number} bytes - バイト数
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
 * パーセンテージを計算
 * @param {number} original - 元のサイズ
 * @param {number} minified - 圧縮後のサイズ
 * @returns {string}
 */
function calculateReduction(original, minified) {
  const reduction = ((original - minified) / original) * 100
  return `${reduction.toFixed(1)}%`
}

/**
 * ビルドを実行してサイズを測定
 * @param {string} adapterName - アダプター名
 */
async function measureBuildSize(adapterName) {
  console.log(`\n📦 Building ${adapterName} adapter...\n`)

  // Terserなしでビルド
  console.log('⏳ Building without minification...')
  const configWithoutTerser = createBuildConfig(adapterName, false)
  const bundleWithout = await rollup(configWithoutTerser)
  await bundleWithout.write(configWithoutTerser.output)
  await bundleWithout.close()
  const sizeWithout = getFileSize(configWithoutTerser.output.file)

  // Terserありでビルド
  console.log('⏳ Building with Terser minification...')
  const configWithTerser = createBuildConfig(adapterName, true)
  const bundleWith = await rollup(configWithTerser)
  await bundleWith.write(configWithTerser.output)
  await bundleWith.close()
  const sizeWith = getFileSize(configWithTerser.output.file)

  // 結果を表示
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

// メイン処理
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
