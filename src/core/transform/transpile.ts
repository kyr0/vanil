import {
  CodeBundle,
  Attrs,
  processRequireFunctionCalls,
  processScriptTags,
  processStyleTags,
  splitTopLevelImports,
} from './parse'
import ts from 'typescript'
import { transformImportPaths } from './typescript/rewritepath'
import { isRelativePathImport, resolveNodeImport } from './resolve'
import { bundleRequires } from './bundle'
import { readFileSyncUtf8 } from '../io/file'
import { mayDeclareExports, mayWrapInAsyncIIFE, transformTemplate, transformVanilImports } from './transform'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
import { addToCache, getFromCache } from './cache'
import { dirname, resolve } from 'path'
const postcss = require('postcss')

export type ResultLanguageType = 'js' | 'css'
export type SourceLanguageType = 'tsx' | 'scss'
export type InjectionIntent = 'import' | 'hoist'

const RE_TS_EXPORTS_COMMONJS_INIT = /exports\.[\s\S]*?void 0;\n/
const RE_CONTAINS_REQUIRE_STMT_FOR_ASTRO_COMPONENT = /require[\S]*?\([\S]*?\.astro"/
const RE_HAS_ASYNC_CODE = /await[\S]*/

export const TS_IMPORT_POLYFILL_SCRIPT = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });`

/** strips away the getStaticPaths function impl that may occur
 * in dynamic routing .astro page templates.
 * These use "export" which is prohibited here because we're
 * running the code in a CommonJS setting */
export const stripGetStaticPathsFnDecl = (code: string, context: Context) =>
  code
    .replace(/export(.*?)getStaticPaths/, 'getStaticPaths')
    .replace(`${(context as any).isolatedGetStaticPathsFnCode}`, '')

/** takes the typeScriptCode and htmlCode; transpiles into an atomic async function */
export const transpileTemplate = (codeBundle: CodeBundle, context: Context): string => {
  const importsAndCode = splitTopLevelImports(codeBundle.typeScriptCode)
  const preparedTSXCode = escapeAndNumbInlineStyleAndScriptTags(codeBundle.htmlCode, context)

  // e.g. .astro components should be sync
  const hasAsyncImpl = !!RE_HAS_ASYNC_CODE.test(importsAndCode.codeStatements)

  const scriptCode = `\n
    // merge runtime and context-provided parts to a uniform global object
    // where direct use of Vanil and access to globalThis.Vanil is both valid
    globalThis.Vanil = Vanil = { ...(globalThis.Vanil || {}), ...(Vanil || {}), tsx }

    // Astro compatibility
    globalThis.Astro = Astro = Vanil;

    // Vanil template Node.js SSG imports (re-ordered)
    ${importsAndCode.importStatements}
    
    // makes sure component .astro templates render sync
    export default ${hasAsyncImpl ? 'async' : ''}() => {

        // Vanil template Node.js SSG code
        ${stripGetStaticPathsFnDecl(importsAndCode.codeStatements, context)}

        // evaluation of CSS styles via executing template literals
        // and storing the computation result in context
        ${context.styleReplacements!.map(
          (styleReplacement, index) =>
            `
            if (Vanil.props.context.styleReplacements[${index}]) {
              Vanil.props.context.styleReplacements[${index}].replacement = 
                \`${styleReplacement.original}\`
            }
            `,
        )}
        
        return ( ${preparedTSXCode} )
    }\n
    `

  const cachedCode = getFromCache(scriptCode, context)
  if (cachedCode) return cachedCode

  let transpiledCode = ts
    .transpileModule(scriptCode, {
      ...context.transpileOptions,
      transformers: {
        // relative imports must be re-written to apply the
        // specific sourcePath-relative import logic
        // (code is evaluated in runtime scope of vanil later)
        before: [
          transformImportPaths({
            rewrite: (importPath) => {
              if (importPath.endsWith('.astro') && context.isProcessingComponent) {
                return resolve(dirname(context.path!), importPath)
              }
              return resolveNodeImport(importPath, context)
            },
          }),
        ],
      },
    })
    .outputText.replace(TS_IMPORT_POLYFILL_SCRIPT, '')

  // make sure SSG code can import .astro component templates
  transpiledCode = inlineTranspileImportedVanilComponents(transpiledCode, context)

  // top-level import statements come first
  // async immediately invoked function execution follows (a-iife)
  // providing a local Vanil argument including all config properties
  // and the path to the source template
  // a-iife starts with the rest of the code (imports stipped and reordered on top),
  // followed by returning the htmlCode which is assumed to be JSX/TSX
  return addToCache(scriptCode, transpiledCode, context)
}

const transpileInlineVanilComponent = (importPath: string, context: Context) => {
  if (importPath.endsWith('.astro')) {
    // make sure the .astro page template will HMR when this .astro
    // component dependency changes
    addFileDependency(importPath, context)

    // .astro template page path
    const _contextPath = context.path

    // for component transpilation change path to component path
    context.path = importPath
    context.isProcessingComponent = true

    // stash/reset style replacements as they shouldn't affect relative .astro components
    const _styleReplacements = context.styleReplacements!
    context.styleReplacements = []

    const transformedComponentCode = transformTemplate(importPath, context)

    // reply style replacements and merge with potential new ones
    context.styleReplacements = [...context.styleReplacements, ..._styleReplacements]

    // reset to .astro template page path
    context.isProcessingComponent = false
    context.path = _contextPath

    // assigning the original local name here (too)
    // as this is a multi-step, isolated transpile without shared
    // name cache, locally declared names diverge
    const componentCode = `{ default: (function() {
          
          const _origVanilProps = { ...Vanil.props }
          const _origIsPage = Vanil.isPage
          const _contextPath = Vanil.props.context.path

          Vanil.props.context.path = '${importPath}'
          Vanil.isPage = false

          importVanilComponent(arguments[0])

          ${transformedComponentCode}\n

          const vdom = exports.default.apply(this, arguments)

          // restore Vanil.props to not leak/accumulate/override
          // them in outer scope
          Vanil.props.context.path = _contextPath
          Vanil.props = _origVanilProps
          Vanil.isPage = _origIsPage

          return vdom
        })}`

    return componentCode
  }
}

/** inlines code of require() calls towards .astro component template files */
export const inlineTranspileImportedVanilComponents = (transpiledCode: string, context: Context) => {
  // only do .astro component require("**/*.astro") code rewrites
  // when the code contains such requires

  if (RE_CONTAINS_REQUIRE_STMT_FOR_ASTRO_COMPONENT.test(transpiledCode)) {
    transpiledCode = processRequireFunctionCalls(transpiledCode, (importPath: string) => {
      const astroComponentInlineCode = transpileInlineVanilComponent(importPath, context)

      if (astroComponentInlineCode) {
        return astroComponentInlineCode
      }
      addFileDependency(importPath, context)
      return `require("${importPath}")`
    })
  } else {
    // imports in .astro components
    transpiledCode = processRequireFunctionCalls(transpiledCode, (importPath: string) => {
      const astroComponentInlineCode = transpileInlineVanilComponent(importPath, context)

      if (astroComponentInlineCode) {
        return astroComponentInlineCode
      }

      if (isRelativePathImport(importPath)) {
        // resolve relative to the .astro component, not relative to the importing .astro page template
        importPath = resolve(dirname(context.path!), importPath)
      }
      addFileDependency(importPath, context)
      return `require("${importPath}")`
    })
  }
  return transpiledCode
}

/** transpiles SSG code in general */
export const transpileSSGCode = (scriptCode: string, context: Context) => {
  const cachedCode = getFromCache(scriptCode, context)
  if (cachedCode) return cachedCode

  // pre-process vanil imports
  scriptCode = transformVanilImports(scriptCode)

  let transpiledCode = ts
    .transpileModule(scriptCode, {
      ...context.transpileOptions,
      transformers: {
        // relative imports must be re-written to apply the
        // specific sourcePath-relative import logic
        // (code is evaluated in runtime scope of vanil later)
        before: [
          transformImportPaths({
            rewrite: (importPath: string) => resolveNodeImport(importPath, context),
          }),
        ],
      },
    })
    .outputText.replace(TS_IMPORT_POLYFILL_SCRIPT, '')

  // make sure SSG code can import .astro component templates
  transpiledCode = inlineTranspileImportedVanilComponents(transpiledCode, context)

  // top-level import statements come first
  // async immediately invoked function execution follows (a-iife)
  // providing a local Vanil argument including all config properties
  // and the path to the source template
  // a-iife starts with the rest of the code (imports stipped and reordered on top),
  // followed by returning the htmlCode which is assumed to be JSX/TSX
  return addToCache(scriptCode, transpiledCode, context)
}

/** transpiles and wraps runtime code; cares for re-ordering imports */
export const transpileRuntimeInteractiveScriptCode = (
  scriptCode: string,
  splitImports = true,
  path: string = '.',
  injectionIntent: InjectionIntent = 'import',
  context: Context,
): string => {
  let code = scriptCode
  let transpiledCode = getFromCache(scriptCode, context)

  if (!transpiledCode) {
    if (splitImports) {
      const importsAndCode = splitTopLevelImports(scriptCode)

      // support for top-level await
      code = `${importsAndCode.importStatements}
                ${mayWrapInAsyncIIFE(importsAndCode.codeStatements)}`
    }

    transpiledCode = transpileTSX(code, context, injectionIntent)

    // hoisted code might need an async() iife wrapper,
    // while imported code is safely wrapped already
    if (injectionIntent === 'hoist') {
      transpiledCode = mayWrapInAsyncIIFE(transpiledCode)
    }
    addToCache(scriptCode, transpiledCode, context)
  }
  return bundleRequires(transpiledCode, path, context)
}

/** transpiles arbitrary ts/tsx code as CJS module type code */
export const transpileTSX = (code: string, context: Context, injectionIntent: InjectionIntent = 'import') => {
  const cachedCode = getFromCache(code, context)
  if (cachedCode) return cachedCode

  // pre-process vanil imports
  code = transformVanilImports(code)

  let transpiledCode = ts
    .transpileModule(code, {
      ...context.transpileOptions,
    })
    .outputText // typescript outputs an exports initializer that
    // counters the window-local unified exports object concept
    .replace(RE_TS_EXPORTS_COMMONJS_INIT, '')
    .replace(TS_IMPORT_POLYFILL_SCRIPT, '')

  if (injectionIntent === 'import') {
    return mayDeclareExports(transpiledCode)
  }
  return addToCache(code, transpiledCode, context)
}

/** transpiles style code using PostCSS; this is called from different stages */
export const transpileStyleCode = (styleCode: string, attributes: any, context: Context) => {
  const cachedCode = getFromCache(styleCode, context)
  if (cachedCode) return cachedCode

  // style code is relative the an .astro component
  // change the context for the time of processing
  // (resolve() fn impl. in import plugin is affected)
  const _contextPath = context.path
  if (attributes.rel) {
    context.path = attributes.rel
  }

  const transpiledCss = postcss(context.postCssPlugins).process(styleCode).css

  if (attributes.rel) {
    context.path = _contextPath
  }
  return addToCache(styleCode, transpiledCss, context)
}

/** style code that has been marked for post-processing is replaced here */
export const replaceStyleReplacements = (htmlCode: string, context: Context) => {
  context.styleReplacements?.forEach((styleReplacement) => {
    htmlCode = htmlCode.replace(
      styleReplacement.original,
      transpileStyleCode(styleReplacement.replacement, styleReplacement.attributes, context),
    )
  })
  return htmlCode
}

/** helper function, used to transpile code hoised in tsx() transform  */
export const loadAndTranspileCode = (
  absolutePath: string,
  type: ResultLanguageType,
  attributes: any,
  injectionIntent: InjectionIntent = 'import',
  context: Context,
) => {
  const fileContents = readFileSyncUtf8(absolutePath)

  switch (type) {
    case 'css':
      return transpileStyleCode(fileContents, attributes, context)

    case 'js':
    default:
      return transpileRuntimeInteractiveScriptCode(fileContents, false, absolutePath, injectionIntent, context)
  }
}

/** escapes syntax characters prone to immediate evaluation */
export const escapeCurlyBracketsAndBackticks = (code: string) => {
  return code
    .replace(/`/gm, '__VANIL_BACKTICK__')
    .replace(/\{/gm, '__VANIL_CURLY_BACKET_OPEN__')
    .replace(/\}/gm, '__VANIL_CURLY_BACKET_CLOSE__')
}

/** unescapes syntax characters prone to immediate evaluation */
export const uncapeCurlyBracketsAndBackticks = (code: string) => {
  return code
    .replace(/__VANIL_BACKTICK__/gm, '`')
    .replace(/__VANIL_CURLY_BACKET_OPEN__/gm, '{')
    .replace(/__VANIL_CURLY_BACKET_CLOSE__/gm, '}')
}

/** wraps innerText JSX node content in curly backets to block evaluation */
const wrapInJSXCurlyBracketsString = (code: string) => `{\`${code}\`}`

// 1. escape { and ` characters globally (1st step numbing)
// 2. wrap in {``} to really numb the code while in SSG evaluation regarding TSX transforms
const numbCodeForSSGEvaluation = (code: string) => {
  code = escapeCurlyBracketsAndBackticks(code)
  return wrapInJSXCurlyBracketsString(code)
}

/**
 * escapes and transpiles inline script code before it is passed to the
 * server-side transpiler and evaluation; this is necessary to "numb" such
 * runtime-interactive code as it shouldn't be executed server-side at all
 */
export const escapeAndNumbInlineStyleAndScriptTags = (tsxCode: string, context: Context): string => {
  // walk thru all <script> tags and
  // 1. transpile them (.ts -> .js)
  // 2. numb code for SSG evaluation

  tsxCode = processScriptTags(tsxCode, (codeOfTag: string) => numbCodeForSSGEvaluation(codeOfTag))

  return processStyleTags(tsxCode, (codeOfTag: string, attrs: Attrs) => {
    // remember style to be evaluated via codegen
    context.styleReplacements!.push({
      original: codeOfTag,
      replacement: codeOfTag,
      attributes: {
        ...attrs,
        ...(context.isProcessingComponent
          ? {
              // setting the .astro component relation so that
              // @imports can be resolved relative to the component path
              // not relative to the importing .astro page template path
              rel: context.path,
            }
          : {}),
      },
    })
    return numbCodeForSSGEvaluation(codeOfTag)
  })
}
