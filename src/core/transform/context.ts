import { getPostCSSPlugins } from '../config/postcss'
import { geTranspileOptions } from '../config/transpileOptions'
import { getDefaultHookConfig } from '../config/hook'
import { getDefaultLoaderMap } from '../config/loader'
import { Context } from '../../@types/context'

/** fills in emptiness such as initializing optional properties */
export const validateContext = (context: Context) => {
  // reset values per single page run
  context.styleReplacements = []

  context.isProcessingComponent = false

  if (!context.hooks) {
    context.hooks = getDefaultHookConfig(context)
  }

  if (!context.loaderMap) {
    context.loaderMap = getDefaultLoaderMap()
  }

  // defaut internal config
  context.transpileOptions = geTranspileOptions(context)
  context.postCssPlugins = getPostCSSPlugins(context)

  // refs map of refName of
  // element in VDOM -> generated CSS selector query
  context.refs = {}

  // used to transmit params and props determined
  // via dynamic routing ([param] and [...param])
  if (!context.pageParamsAndProps) {
    context.pageParamsAndProps = {
      params: {},
      props: {},
    }
  }

  // maps from the .astro file path to the actual .html file paths in dist folder
  if (!context.materializedHtmlFilePaths) {
    context.materializedHtmlFilePaths = {}
  }

  // === only relevant for command: dev

  // file dependencies, used for tracing / triggering specific HMR
  // when dependencies of .astro page templates change
  if (!context.fileDependencies) {
    context.fileDependencies = {}
  }

  // used for caching materialized paths (for pages with dynamic routes)
  // as a map of context.path -> materializedPaths to know which actually
  // rendered out file did change
  //context.materializedPaths = {}

  // caches transpiled code for quick lookup and re-use across transforms
  if (!context.codeCache) {
    context.codeCache = {}
  }

  // invalidate runtime script and stylesheet injection cache per page
  context.pageRuntimeScriptsAndLinks = []
  return context
}

/** adds a file dependency to the linked list */
export const addFileDependency = (filePath: string, context: Context) => {
  if (!context.fileDependencies![filePath]) context.fileDependencies![filePath] = []

  if (context.fileDependencies![filePath].indexOf(context.path!) === -1) {
    // single filePath -> .astro template list
    context.fileDependencies![filePath].push(context.path!)
  }
}

/** adds a materialized path to the map */
/*
export const addMaterializedPath = (materializedPath: string, context: Context) => {

    if (!context.materializedPaths![context.path!]) context.materializedPaths![context.path!] = []

    if (context.materializedPaths![context.path!].indexOf(materializedPath) === -1) {

        // context.path -> all materialized file paths of that dyanmic routing .astro template page
        context.materializedPaths![context.path!].push(materializedPath)
    }
}
*/

/** distinctively adds a materialized HTML file path to the map */
export const addMaterializedHtmlFilePath = (materializedHtmlFilePath: string, context: Context) => {
  if (!context.materializedHtmlFilePaths![context.path!]) context.materializedHtmlFilePaths![context.path!] = []

  if (context.materializedHtmlFilePaths![context.path!].indexOf(materializedHtmlFilePath) === -1) {
    // context.path -> all materialized file paths of
    // that dyanmic routing .astro template page
    context.materializedHtmlFilePaths![context.path!].push(materializedHtmlFilePath)
  }
}
