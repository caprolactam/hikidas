import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import banner from 'rollup-plugin-banner2'
import pkg from './package.json' with { type: 'json' }

const external = (id) =>
  [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].some((d) => id.startsWith(d))

function createAdapterConfig(adapterName, env) {
  const isDevelopment = env === 'development'
  const exportPath = `./${adapterName}`
  const outputFile = isDevelopment
    ? pkg.exports[exportPath].development
    : pkg.exports[exportPath].production

  return {
    input: `src/react/adapters/${adapterName}/index.ts`,
    output: {
      file: outputFile,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      replace({
        __DEV__: JSON.stringify(isDevelopment),
        preventAssignment: true,
      }),
      typescript({
        tsconfig: './tsconfig.build.json',
        outDir: `dist/${adapterName}`,
      }),
      getBabelOutputPlugin({
        plugins: ['@babel/plugin-transform-react-pure-annotations'],
      }),
      banner(() => '"use client";\n'),
    ],
    external,
  }
}

/** @type { import('rollup').RollupOptions[] } */
export default ['base-ui', 'radix-ui', 'headlessui'].flatMap((adapterName) => [
  createAdapterConfig(adapterName, 'development'),
  createAdapterConfig(adapterName, 'production'),
])
