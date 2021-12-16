import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { getLiveReloadUrl } from '../../cli/dev'
import { readFileSyncUtf8 } from '../io/file'
import { copyModuleToDistAndBundleForBrowser, getDistFolder } from '../io/folders'
import { oneOf } from '../io/map'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
import { injectVirtualDomElement, createVirtualDomScriptElement } from './dom'
import { processRequireFunctionCalls } from './parse'
import { persistFileAbsolute } from './persist'
import {
  isRemoteImportTarget,
  materializePathSelectFile,
  resolveImportForRuntimeInteractiveCode,
  isAbsoluteFileImportTarget,
  resolveNodeAbsolute,
} from './resolve'
import { mayWrapInAsyncIIFE, wrapInIIFE } from './transform'
import { loadAndTranspileCode, transpileRuntimeInteractiveScriptCode, transpileTSX } from './transpile'
import { Mode } from '../../@types/context/Mode'
import { FeatureFlagActivationMap } from '../../@types/context/featureflags'

/** returns the feature flags as an array of names */
export const featureFlagsArray = (featureFlags: FeatureFlagActivationMap) =>
  Object.keys(featureFlags).filter((moduleName) => featureFlags[moduleName])

/** generates a distinct name for a interactive runtime library variant */
export const getInteractiveRuntimeVariantName = (featureFlags: FeatureFlagActivationMap) =>
  `${featureFlagsArray(featureFlags)
    .map((featureFlagName) => featureFlagName[0])
    .join('')}`

/** verifies if the runtime lib needs to be injected by checking if at least one of the flags are active */
export const requiresInteractiveRuntimeLibrary = (featureFlags: FeatureFlagActivationMap) =>
  oneOf(featureFlags, (flags: any, flagName: string) => flags[flagName])

/** loads all parts of the interactive runtime library, concats them  */
export const bundleInteractiveRuntimeLibrary = (context: Context, featureFlags: FeatureFlagActivationMap) => {
  let runtimeCode = requiresInteractiveRuntimeLibrary(featureFlags)
    ? '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/init.ts')) + '\n' + `Vanil.mode = '${context.mode}'`
    : ''

  if (featureFlags.tsx) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/tsx.ts'))
  }

  if (featureFlags.vdom) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/vdom.ts'))
  }

  if (featureFlags.query) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/query.ts'))
  }

  if (featureFlags.events) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/events.ts'))
  }

  if (featureFlags.warnOnSsgApiUse) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/warnOnSsgApiUse.ts'))
  }

  if (featureFlags.livereload) {
    runtimeCode += `\n__VANIL_LIVE_RELOAD_URL = "${getLiveReloadUrl(context.config)}";\n`
    runtimeCode += readFileSyncUtf8(resolve(__dirname, '../runtime/livereload.ts'))
  }

  if (featureFlags.store) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/store.ts'))
  }

  if (featureFlags.bus) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/bus.ts'))
  }

  if (featureFlags.i18n) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/i18n.ts'))
  }

  // --- built-in components (interactive runtime)

  // Code ande Debug depend on Link
  if (featureFlags.Code || featureFlags.Debug || featureFlags.Link) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/components/Link.tsx'))
  }

  // Code ande Debug depend on Script
  if (featureFlags.Code || featureFlags.Debug || featureFlags.Script) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/components/Script.tsx'))
  }

  // Debug depends on Code
  if (featureFlags.Code || featureFlags.Debug) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/components/Code.tsx'))
  }

  if (featureFlags.Debug) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/components/Debug.tsx'))
  }

  if (featureFlags.Trans) {
    runtimeCode += '\n' + readFileSyncUtf8(resolve(__dirname, '../runtime/components/Trans.tsx'))
  }

  if (featureFlags.Markdown) {
    runtimeCode += '\n Vanil.Markdown = () => "Error: Markdown> is not supported at runtime in browser."'
  }

  if (!runtimeCode) return ''

  // warp in async iife to enclose from polluting global scope
  return mayWrapInAsyncIIFE(
    transpileRuntimeInteractiveScriptCode(`${runtimeCode};`, false, context.path!, 'hoist', context),
    true,
  )
}

export const extractAllScriptCodeFromVdom = (node: IVirtualNode) => {
  let code = ''
  const walk = (currentNode: IVirtualNode) => {
    if (!currentNode) return
    if (currentNode.type === 'script') {
      code += currentNode.children[0]
      return
    } else if (currentNode.children) {
      for (let i = 0; i < currentNode.children.length; i++) {
        walk(currentNode.children[i])
      }
    }
  }
  walk(node)
  return code
}

/** runtime library feature detector based on actual generated code */
export const detectRuntimeLibraryFeatures = (node: IVirtualNode, mode: Mode): FeatureFlagActivationMap => {
  const isInDevMode = mode === 'development'

  const code = extractAllScriptCodeFromVdom(node)

  const baseFeatureFlagsMap = {
    events:
      /\{[\s\S]*?on[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code) || // all variants of { on } = Vanil usage
      /Vanil\.e\(/.test(code), // generated event hook
    query:
      /\$[\s]*?\(/.test(code) || // all variants of $('#query')
      /\{[\s\S]*?refs[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { $ } = Vanil usage
    tsx:
      /Vanil\.tsx\(/.test(code) || // generated result of <tsx> syntax usage (fn)
      /\{[\s\S]*?tsx[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { tsx } = Vanil usage
    vdom: /\{[\s\S]*?render[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { render } = Vanil usage
    store:
      /\{[\s\S]*?set[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code) || // all variants of { set } = Vanil usage
      /\{[\s\S]*?get[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { get } = Vanil usage
    bus:
      /\{[\s\S]*?listen[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code) || // all variants of { listen } = Vanil usage
      /\{[\s\S]*?emit[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { emit } = Vanil usage
    i18n:
      /\{[\s\S]*?t[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code) || // all variants of { t } = Vanil usage
      /\{[\s\S]*?changeLanguage[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code) || // all variants of { changeLanguage } = Vanil usage
      /\{[\s\S]*?setTranslations[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code), // all variants of { setTranslations } = Vanil usage

    // components runtime support
    Code: /Vanil.tsx\(Code/.test(code) || /\{[\s\S]*?Code[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),
    Debug: /Vanil.tsx\(Debug/.test(code) || /\{[\s\S]*?Debug[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),
    Script: /Vanil.tsx\(Script/.test(code) || /\{[\s\S]*?Script[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),
    Link: /Vanil.tsx\(Link/.test(code) || /\{[\s\S]*?Link[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),
    Trans: /Vanil.tsx\(Trans/.test(code) || /\{[\s\S]*?Trans[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),
    Markdown: /Vanil.tsx\(Markdown/.test(code) || /\{[\s\S]*?Markdown[\s\S]*?\}[\s]*?=[\s]*?Vanil/.test(code),

    // always add HMR support in dev mode
    livereload: isInDevMode,

    // when SSG runtime API is used in browser/interactive, add warnings as exceptions in dev
    warnOnSsgApiUse: isInDevMode && (/fetchContent[\s]*?\(/.test(code) || /resolve[\s]*?\(/.test(code)),
  }
  return baseFeatureFlagsMap
}

/** processes all require(...) statements and inflates, transpiles, bundles its code recursively */
export const bundleRequires = (code: string, path: string = '.', context: Context) => {
  const resultCode = processRequireFunctionCalls(code, (importPath: string) => {
    if (importPath === 'vanil') {
      return `Vanil`
    }

    const nodeResolvedPath = resolveNodeAbsolute(importPath, context.path!)

    // like http://... or //foo or /foo.ts
    // (in terms of fetch from HTTP endpoint because the file doesn't exist on disk)
    if (isRemoteImportTarget(importPath)) {
      return `await import("${importPath}")`
    } else {
      // like /foo/bar.ts
      if (isAbsoluteFileImportTarget(importPath)) {
        importPath = materializePathSelectFile(importPath)
      } else if (nodeResolvedPath) {
        const relativeDistModuleImportPath = resolveNodeAbsolute(importPath, context.path!).split('node_modules')[1]
        const moduleBaseName = importPath.split('/')[0]

        const absoluteImportPath = join(getDistFolder(context.config), 'node_modules', relativeDistModuleImportPath)

        if (!existsSync(absoluteImportPath)) {
          copyModuleToDistAndBundleForBrowser(context, moduleBaseName, absoluteImportPath)
        }

        return `eval(\`module={};(() => {\${await (await fetch("/node_modules${relativeDistModuleImportPath}.bundle.js")).text()}})();module.exports\`)`
      } else if (isRelativeSrcTarget(importPath)) {
        // like ../foo or ./foo
        importPath = resolveImportForRuntimeInteractiveCode(importPath, path)

        if (!existsSync(importPath)) {
          // try resolving with file extension
          importPath = resolve(path, `${importPath}.js`)
        }
      } else {
        return `((() => { throw new Error("Error: '${importPath}' cannot be imported!")})())`
      }
    }

    if (importPath.startsWith('..')) {
      importPath = resolve(process.cwd(), importPath)
    }

    // add dependencies for change detection
    addFileDependency(importPath, context)

    // using loadAndTranspileCode we run this process recursively (ergo: general purpose bundle processing)
    // returning the exports at the end of the iife allows ideomatic direct code injection
    return wrapInIIFE(`${loadAndTranspileCode(importPath, 'js', 'tsx', 'import', context)}`)
  })

  return (
    resultCode

      // enable await in wrapping Promise.resolve
      .replace(/Promise.resolve\(\)\.then\(\(\) =>/, 'Promise.resolve().then(async() =>')

      // bundle replace left-overs
      .replace(/const ;/g, '')
      .replace(/let ;/g, '')
      .replace(/var ;/g, '')
  )
}

/** stringifies the state to be accessible via Vanil.state  */
export const bundleRuntimeState = (runtimeState: any, context: Context) => {
  if (
    !runtimeState &&
    !context.runtimeLibraryFeatureFlags!.query &&
    !Object.keys(context.refs!).length &&
    !context.runtimeLibraryFeatureFlags!.i18n
  )
    return ''

  // TODO: perf: potential opportunity for caching

  const runtimeStateCode = transpileTSX(
    `

        // initialize Vanil.props with runtimeState
        Vanil.props = { state: ${JSON.stringify(runtimeState, null, 2)} }

        // set language used at SSG time by default at runtime
        ${
          context.runtimeLibraryFeatureFlags!.i18n
            ? `
        Vanil.language = "${globalThis.Vanil.language}"
        Vanil.translations = ${JSON.stringify(globalThis.Vanil.translations, null, 2)}
        `
            : ''
        }

        ${
          Object.keys(context.refs!).length
            ? `
            // backing data object for refs
            Vanil._refs = ${JSON.stringify(context.refs, null, 2)}

            // proxy refs to make sure we'll always return $-wrapped elements
            Vanil.refs = new Proxy(Vanil._refs, {
                get: function(target, prop, receiver) {
                  const el = Reflect.get(...arguments)
                    return typeof el === 'string' ? document.querySelector(el) : el
                }
            });`
            : ''
        }
    `,
    context,
    'hoist',
  )

  return runtimeStateCode
}

/** hoists the interactive Vanil runtime */
export const injectInteractiveRuntimeLibrary = (
  document: Document,
  headElement: Element,
  context: Context,
  runtimeState: any,
) => {
  if (document && headElement) {
    const runtimeStateCode = bundleRuntimeState(runtimeState, context)

    if (runtimeStateCode) {
      // hoist; available for interactive runtime as Vanil.state
      injectVirtualDomElement(
        headElement,
        createVirtualDomScriptElement(document, runtimeStateCode, {
          role: 'state',
        }),
      )
    }

    const featureFlags = {
      ...context.runtimeLibraryFeatureFlags,
      // determine if runtimeState is given;
      // in this case, initialization code must be added
      runtimeState: !!runtimeStateCode,
    }

    const runtimeVariantName = getInteractiveRuntimeVariantName(featureFlags)
    const distDirPath = getDistFolder(context.config)
    const runtimeVariantDistPath = resolve(distDirPath, 'runtime', `${runtimeVariantName}.js`)

    const isVariantCached = existsSync(runtimeVariantDistPath)
    const interactiveRuntimeCode = isVariantCached
      ? readFileSyncUtf8(runtimeVariantDistPath)
      : // generate a new dynamic interactive runtime lib variant, not cached yet
        bundleInteractiveRuntimeLibrary(context, featureFlags)

    if (!isVariantCached && interactiveRuntimeCode) {
      // ensure it's written to cache
      persistFileAbsolute(runtimeVariantDistPath, interactiveRuntimeCode)
    }

    // reference interactive runtime lib in development
    if (context.mode === 'development') {
      injectVirtualDomElement(
        headElement,
        createVirtualDomScriptElement(document, '', {
          // reference the lib relatively to the dist folder
          src: runtimeVariantDistPath.replace(distDirPath, ''),
          role: 'runtime',
        }),
      )
    } else if (context.mode === 'production') {
      // hoist interactive runtime lib in production

      if (interactiveRuntimeCode) {
        // bundle in Vanil runtime library (unstash, prepend)
        injectVirtualDomElement(
          headElement,
          createVirtualDomScriptElement(document, interactiveRuntimeCode, {
            role: 'runtime',
          }),
        )
      }
    }
  }
}
