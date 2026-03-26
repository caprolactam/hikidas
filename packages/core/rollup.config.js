import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json' with { type: 'json' }

function createConfig(env) {
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
      typescript({
        tsconfig: './tsconfig.build.json',
      }),
    ],
  }
}

/** @type { import('rollup').RollupOptions[] } */
export default [createConfig('development'), createConfig('production')]
