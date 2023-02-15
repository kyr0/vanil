import { buildForNode } from '@jsheaven/easybuild'
import { resolve } from 'path'

await buildForNode({
  entryPoint: './src/core/index.ts',
  outfile: './dist/index.js',
  debug: process.argv.indexOf('--dev') > -1,
  typeDeclarations: true,
  tsConfigPath: resolve(process.cwd(), 'tsconfig.json'),
  esBuildOptions: {
    logLevel: 'error',
  },
})
