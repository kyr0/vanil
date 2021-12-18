import { dirname } from 'path'
import * as colors from 'kleur/colors'
import { parseImportStatements, parseTemplate, rewriteVanilImports } from './parse'
import { transpileTemplate } from './transpile'
import { materializeDOM } from './dom'
import { persistVanilPage } from './persist'
import { optimize } from '../optimize/optimize'
import { run, ScriptExecutionError } from './vm'
import { renderSSGErrorReport } from '../error/report'
import { Context } from '../../@types/context'
import { isAstroPageTemplate, toProjectRootRelativePath } from '../io/folders'

/** does only parse, transpile, run a single .astro template without post-processing */
export const transformTemplate = (templatePath: string, context: Context) => {
  const codeBundle = parseTemplate(templatePath, context)
  return transpileTemplate(codeBundle, context)
}

export const renderError = (context: Context, error: ScriptExecutionError) => {
  const html = renderSSGErrorReport(toProjectRootRelativePath(context.path!, context.config), error, context)

  if (!isAstroPageTemplate(context.path!, context.config)) {
    // we're facing an error inside of a .astro component
    // but we must save the compilation result back to the
    // hosting .astro page template file (materialized)
    context.path! = context.astroPageTemplatePath!
  }
  return optimize(html, context)
}

/** transforms a single .astro template file */
export const transformSingle = async (context: Context) => {
  let html
  let result
  try {
    // change to file directory so that
    // SSG imports are relative to the .astro
    // template file instrinsically
    process.chdir(dirname(context.path!))

    const timeStart = Date.now()
    const transformedTemplateCode = transformTemplate(context.path!, context)
    const timeTransformFinish = Date.now()

    result = await run(transformedTemplateCode, context)

    if (result.error) {
      console.error('ERROR: SSG Node.js execution error', result.error.original)
      return renderError(context, result.error)
    }

    const timeExecutionFinish = Date.now()

    html = await materializeDOM(result, context)

    const timeRenderFinish = Date.now()

    // TODO: color times according to actual time spent
    console.log(
      colors.dim('perf (ms):'),
      colors.green(timeTransformFinish - timeStart),
      colors.dim('(compile)'),
      colors.green(timeExecutionFinish - timeTransformFinish),
      colors.dim('(run)'),
      colors.green(timeRenderFinish - timeExecutionFinish),
      colors.dim('(render)'),
    )
  } catch (e) {
    console.error(
      colors.red('ERROR: Transfrom, run or render failed!'),
      result && result.error ? result.error.original : e,
    )
    return renderError(context, {
      errorType: (e as Error).name,
      errorMessage: (e as Error).message.split('\n')[0],
    })
  }
  return optimize(html, context)
}

export const transformAndPersistSingle = async (context: Context) => {
  // (re)set .astro page template path
  context.astroPageTemplatePath = context.path

  return persistVanilPage(context, await transformSingle(context))
}

/**
 * support for HTML comment syntax in TSX input:
 * remove all <!-- comment --> HTML comments from TSX input
 */
export const stripHtmlComments = (htmlCode: string) => {
  // global (all occurrances) + multiline support using RegExp flag
  return htmlCode.replace(/<!--(.*)-->/gm, '')
}

/** checks if code requires async/await; wraps in async-IIFE in case  */
export const mayWrapInAsyncIIFE = (scriptCode: string, force = false) => {
  if (/await[\s]*?/.test(scriptCode) || force) {
    return `\n(async() => {${scriptCode}})()\n`
  }
  return scriptCode
}

/** declares local exports = {} when exports. is used in code */
export const mayDeclareExports = (scriptCode: string, force = false) => {
  if (/exports\./.test(scriptCode) || force) {
    return scriptCode + '\nreturn exports\n'
  }
  return scriptCode
}

/** wraps code in an (() => { ...code ... })() construct
 * ([i]mmediately [i]nvoked [f]unction [e]xpression) */
export const wrapInIIFE = (scriptCode: string) => `\n(() => {${scriptCode}})()\n`

/** transforms script code imports to use const { ... } = Vanil syntax for from "vanil" imports */
export const transformVanilImports = (scriptCode: string) => {
  const importStmts = parseImportStatements(scriptCode, false /* include await import() dynamic imports too */)

  const rewroteImportStmts = rewriteVanilImports(importStmts)

  rewroteImportStmts.forEach((rewroteImportStmt, i) => {
    scriptCode = scriptCode.replace(importStmts[i], rewroteImportStmt)
  })
  return scriptCode
}
