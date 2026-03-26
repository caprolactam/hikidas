import replace from '@rollup/plugin-replace'
import type { RolldownOptions } from 'rolldown'
import pkg from './package.json' with { type: 'json' }

function createConfig(env: 'development' | 'production'): RolldownOptions {
  const isDevelopment = env === 'development'
  const outputFile = isDevelopment
    ? pkg.exports['.'].development
    : pkg.exports['.'].production

  return {
    input: 'src/index.ts',
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
    ],
  } satisfies RolldownOptions
}

export default [
  createConfig('development'),
  createConfig('production'),
] satisfies RolldownOptions[]
