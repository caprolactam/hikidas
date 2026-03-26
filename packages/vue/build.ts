import replace from '@rollup/plugin-replace'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import pkg from './package.json' with { type: 'json' }

const adapters = ['reka-ui'] as const
type Adapter = (typeof adapters)[number]

const external = (id: string) =>
  [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].some((d) => id === d || id.startsWith(d + '/'))

async function buildAdapter(
  adapterName: Adapter,
  env: 'development' | 'production',
) {
  const isDevelopment = env === 'development'
  const exportPath = `./${adapterName}` as const
  const outputFile = isDevelopment
    ? pkg.exports[exportPath].development
    : pkg.exports[exportPath].production

  await build({
    plugins: [vue()],
    build: {
      lib: {
        entry: `src/adapters/${adapterName}/index.ts`,
        formats: ['es'],
        fileName: () => outputFile.replace('./dist/', ''),
      },
      outDir: 'dist',
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      rollupOptions: {
        external,
        output: {
          entryFileNames: outputFile.replace('./dist/', ''),
        },
        plugins: [
          replace({
            __DEV__: JSON.stringify(isDevelopment),
            preventAssignment: true,
          }),
        ],
      },
    },
    configFile: false,
  })
}

for (const adapter of adapters) {
  await buildAdapter(adapter, 'development')
  await buildAdapter(adapter, 'production')
}
