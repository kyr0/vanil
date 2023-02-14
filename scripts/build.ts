import { build, Options } from "tsup"
import { getEsbuildNodeTargetVersion } from "../src/core";
import { externalizeAllNodeModulesPlugin } from "../src/core/bundle/externalize-all-node-modules-plugin";
import { solidPlugin } from "../src/core/bundle/solid-plugin"
import { copyFiles } from "../src/core/io"
import { getArgLine } from "../src/core/process"

// example call:
// yarn build 
// OR:
// ts-node --esm --experimental-specifier-resolution=node ./scripts/build.ts

// extracts a type from an array element
type ArrayElement<ArrayType extends unknown[]|undefined> = 
  ArrayType extends (infer ElementType)[] ? ElementType : never;

// extracted type of an esbuild plugin from the tsup bundled esbuild version
type TsupEsbuildPlugin = ArrayElement<Options["esbuildPlugins"]>

const baseBuildOptions: Options = {
  bundle: true,
  splitting: false,

  // TODO: switch tsup for something else and inline
  sourcemap: true,
  dts: true,
  // in case --watch flag has been provided via CLI
  watch: getArgLine().indexOf('watch') > -1,
  esbuildPlugins: [
    externalizeAllNodeModulesPlugin() as TsupEsbuildPlugin, 
    solidPlugin({
      generate: 'ssr',
      hydratable: false
    }) as TsupEsbuildPlugin
  ],
  //minifySyntax: true,
  minifyWhitespace: true,
  format: "esm",
  target: 'es2020'
}

/** builds the library codebase (index.ts), the ts runner CLI (run.ts) and runtime interface */
await build({
  ...baseBuildOptions,
  target: getEsbuildNodeTargetVersion(),
  platform: "node",
  format: "esm",
  entryPoints: ['./src/core/index.ts', './src/core/cli/run.ts', './src/core/cli/run-command.ts'],
  outDir: './dist/core',
  onSuccess: async() => {
    
    console.time('Copying files to ./dist...')

    copyFiles('./package.json', './dist/package.json')

    // to be imported by userland projects tsconfig.json
    copyFiles('./src/typings.d.ts', './dist/typings.d.ts')

    // to be imported / extended by userland projects
    copyFiles('./src/tsconfig.json', './dist/tsconfig.json')

    // to be used as a runner script to switch to modern mode
    copyFiles('./dist/core/cli/run.js', './dist/run.js')
    copyFiles('./dist/core/cli/run.js.map', './dist/run.js.map')

    // runs ts-node configured for ESM
    copyFiles('./dist/core/cli/run-command.js', './dist/run-command.js')
    copyFiles('./dist/core/cli/run-command.js.map', './dist/run-command.js.map')

    // copy all .ts files into output for IDE's to pick them 
    // when developers use their IDE's "jump to definition" feature
    copyFiles('./src/', './dist/')

    console.timeEnd('Copying files to ./dist...')
  }
})

/** general runtime for import */
await build({
  ...baseBuildOptions,
  target: getEsbuildNodeTargetVersion(),
  platform: "node",
  format: "esm",
  entryPoints: ['./src/runtime.tsx'],
  outDir: './dist'
})

/** builds the server runtime impl */
await build({
  ...baseBuildOptions,
  target: getEsbuildNodeTargetVersion(),
  platform: "node",
  format: "esm",
  define: {
    "isServer": JSON.stringify(true)
  },
  entryPoints: ['./src/runtime-server.tsx'],
  outDir: './dist'
})

/** builds the client runtime impl */
await build({
  ...baseBuildOptions,
  platform: 'browser',
  define: {
    "isServer": JSON.stringify(false)
  },
  entryPoints: ['./src/runtime-client.tsx', './src/runtime-client/__live-reload.ts'],
  outDir: './dist',
  onSuccess: async() => {
    
    console.time('Copying files to ./dist...')

    copyFiles('./dist/runtime-client/__live-reload.js', './dist/core/runtime-client/__live-reload.js')
    copyFiles('./dist/runtime-client/__live-reload.js.map', './dist/core/runtime-client/__live-reload.js.map')

    console.timeEnd('Copying files to ./dist...')
  }
})