import vm from 'vm'
import { Context } from './context'
import { RuntimeContextAccessor } from '../runtime'
import { fetch } from 'undici'
import { loadFiles } from "../runtime-server/load-files"
import { publishFile } from './action/publishFile'
import { pathToFileURL } from 'url'; 
import { createRequire } from 'module';
import { publishAsFile } from './action/publishAsFile'

export interface DefaultExport { 
  default: () => unknown, 
  [fnName: string]: () => unknown 
}

/** dynamic ESM module linking */
export const linker = (runContext: vm.Context) => {
  return async (specifier: string) => {
    return new Promise(async (resolveLink) => {
      let module: any
      if (!module) {
        module = await import(specifier)
      }

      const exportNames = Object.keys(module)

      // @ts-ignore
      const syntheticModule = new vm.SyntheticModule(
        exportNames,
        function () {
          exportNames.forEach((key) => {
            this.setExport(key, module[key])
          })
        },
        { context: runContext },
      )
      resolveLink(syntheticModule)
    })
  }
}

/** global, top-level variables declared for server-side execution */
export interface RunContext {
    // only available at server-side
    _context: Context
    _loadFiles: typeof loadFiles,
    _publishFile: typeof publishFile,

    // available at client-side
    _renderContext: RuntimeContextAccessor
    console: Console
    fetch: typeof fetch
}

export interface RunOptions {
  context?: unknown
  // source map to real code line offset in case code is banner-injected
  lineOffset?: number
  identifier?: string
  initializeImportMeta?: Function
}

/** dynamic ESM module execution via VM */
export const run = async<Imports, Exports = DefaultExport>(scriptCode: string, contextData: Imports, options?: RunOptions): Promise<{
  exports: Exports,
  global: RunContext
}> => {

  const context = vm.createContext(contextData)

  const sourceTextModuleOptions: RunOptions = {
    ...(options || {}),
    context,
  }

  // @ts-ignore
  const mod = new vm.SourceTextModule(scriptCode, sourceTextModuleOptions)

  await mod.link(linker(context))
  await mod.evaluate()

  return {
    exports: mod.namespace,
    global: context as RunContext
  }
}

/** dynamic ESM module execution of a page via VM */
export const runPage = async<Exports = DefaultExport>(scriptCode: string, renderContext: RuntimeContextAccessor, context: Context): Promise<{
  exports: Exports,
  global: RunContext
}> => {
  return run(scriptCode, {
    _renderContext: renderContext,
    _context: context,
    _loadFiles: loadFiles,
    _publishFile: publishFile,
    _publishAsFile: publishAsFile,
    console,
    fetch,
    process,
    require: createRequire(pathToFileURL(import.meta.url))
  } as RunContext, {
    // make sure the name is correct in source display
    identifier: renderContext.pageSrc,
  })
}