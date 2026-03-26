import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import type { RolldownOptions } from 'rolldown'
import { replacePlugin } from 'rolldown/plugins'
import pkg from './package.json' with { type: 'json' }

const external = (id: string) =>
  [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].some((d) => id === d || id.startsWith(d + '/'))

const adapters = ['base-ui', 'radix-ui', 'headlessui'] as const
type Adapter = (typeof adapters)[number]

function createAdapterConfig(
  adapterName: Adapter,
  env: 'development' | 'production',
): RolldownOptions {
  const isDevelopment = env === 'development'
  const exportPath = `./${adapterName}` as const
  const outputFile = isDevelopment
    ? pkg.exports[exportPath].development
    : pkg.exports[exportPath].production

  return {
    input: `src/adapters/${adapterName}/index.ts`,
    output: {
      file: outputFile,
      format: 'esm',
      sourcemap: true,
      banner: '"use client";\n',
    },
    plugins: [
      replacePlugin(
        { __DEV__: JSON.stringify(isDevelopment) },
        { preventAssignment: true },
      ),
      getBabelOutputPlugin({
        plugins: ['@babel/plugin-transform-react-pure-annotations'],
      }),
    ],
    external,
  } satisfies RolldownOptions
}

export default adapters.flatMap((adapterName) => [
  createAdapterConfig(adapterName, 'development'),
  createAdapterConfig(adapterName, 'production'),
]) satisfies RolldownOptions[]
