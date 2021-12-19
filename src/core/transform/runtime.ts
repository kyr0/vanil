import fg from 'fast-glob'
import { resolvePathRelative, isRelativeSrcTarget } from './resolve'
import fetch from 'cross-fetch'
import { loadAndTranspileCode, ResultLanguageType } from './transpile'
import { RAW_LOADER_NAME } from '../loader/core/raw'
import { LoaderRegistration } from '../loader/interface'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
import { getMatchingLoader, isLoaderRegistered } from '../loader/loader'
import { accessSync, constants, existsSync } from 'fs'
import { isGlobPath } from '../io/folders'
import { paginate } from './routing'

// initialize global Vanil
;(globalThis.Vanil as any) = {
  ...(globalThis.Vanil || {}),
}

// make isomorphic part of the runtime (i18n, store) available for SSG
// (automatically assigns to Vanil global object)
import '../runtime/store'
import '../runtime/i18n'

// built-in Components
import '../runtime/components/Script'
import '../runtime/components/Link'
import '../runtime/components/Debug'
import '../runtime/components/Code'
import '../runtime/components/Trans'
import '../runtime/components/Markdown'

import { SSGRuntime } from '../../@types/runtime'
import { dirname as nativeDirname, resolve as nativeResolve } from 'path'
import { SLOT_DEFAULT_NAME } from './tsx'

/** Vanil.reloadOnChange implementation to allow dynamic  */
export const restartOnFileChange = (filePath: string, context: Context) => {
  context.fileDependenciesToRestartOn!.push(filePath)
}
globalThis.restartOnFileChange = restartOnFileChange

/** Vanil.fetchContent() implementation */
export const astroFetchContent = (globalThis.vanilFetchContent = (targetPath: string, context: Context) => {
  const targetPathSplits = targetPath.split(':')
  let requiredLoaderName: string

  if (isLoaderRegistered(targetPathSplits[0], context)) {
    // is the 'raw' in 'raw:../foo/bar.txt'
    requiredLoaderName = targetPathSplits[0]
    // is the '../foo/bar.txt'
    targetPath = targetPathSplits[1]
  }

  const resolvedPath = resolvePathRelative(targetPath, context.path!)
  const candidates: Array<any> = []

  // throw error and trigger panic report
  if (!isGlobPath(resolvedPath) && !existsSync(resolvedPath)) {
    try {
      accessSync(resolvedPath, constants.R_OK)
    } catch (e) {
      throw new Error(`Vanil.fetchContent('${targetPath}'): File isn't readable!`)
    }
  }

  // fast-glob sync resolve
  fg.sync(resolvedPath).forEach((path) => {
    // all files fetched are also dependencies to the page, should HMR
    addFileDependency(path, context)

    // selects a specific loader if required by the user
    // alternatively, an automatic file extension matching
    // process is run
    const loaderRegistration: LoaderRegistration = getMatchingLoader(context, path, requiredLoaderName)

    candidates.push(
      loaderRegistration
        ? // some loader matched
          loaderRegistration.cb(path, context)
        : // in case neither the user decided for a loader
          // nor we could fine a matching loader for the file extension,
          // we'd fall back to the raw loader
          context.loaderMap![RAW_LOADER_NAME].cb(path, context),
    )
  })
  return candidates
})

/** hoisting of relative <script> imports -> <script>code</script> */
export const getScriptHoisted = (path: string, type: ResultLanguageType, attributes: any, context: Context) =>
  loadAndTranspileCode(path, type, attributes, 'hoist', context)

/** hoisting of relative <link> imports -> <style> sheets */
export const getStyleSheetHoisted = (path: string, type: ResultLanguageType, attributes: any, context: Context) =>
  loadAndTranspileCode(path, type, attributes, 'hoist', context)

/** implements fetch() in a isomorphic way */
globalThis.fetch = fetch

/** checks that a path is neither absolute nor a remote URL */
globalThis.isRelativeSrcTarget = isRelativeSrcTarget

/** resolves a relative local file path into an absolute */
globalThis.resolvePathRelative = (targetPath: string, path: string) => nativeResolve(nativeDirname(path), targetPath)

/** hoists a CSS <link> by href */
globalThis.getStyleSheetHoisted = getStyleSheetHoisted

/** hoists a JS <script> by src */
globalThis.getScriptHoisted = getScriptHoisted

/**
 * chunks the data in slices of paginationParams.pageSize and
 * generates a page prop to be passed to each page
 */
globalThis.paginate = paginate

/** preprocesses props that are passed down to an .astro component on import like
 * import MyVanilComponent from "../components/my.astro" */
export const preprocessVanilComponentPropsAndSlots = (props: any, Vanil: Partial<SSGRuntime>) => {
  const propsKeys = Object.keys(props)

  // walks over all props passed to a component
  // and divides and conquers the "children" prop to
  // assign them to Vanil.slots, so tsx() can create the <slot>s later;
  // assigning all other props to Vanil.props
  for (let i = 0; i < propsKeys.length; i++) {
    if (propsKeys[i] === 'children') {
      const children = props[propsKeys[i]]

      if (Array.isArray(children)) {
        children.forEach((child) => {
          // defined slot name
          if (child.attributes && child.attributes.slot) {
            Vanil.slots![child.attributes.slot] = {
              type: 'fragment',
              children: [child],
            }
          } else {
            let prevChildren = []

            if (Vanil.slots![SLOT_DEFAULT_NAME]) {
              prevChildren = (Vanil.slots![SLOT_DEFAULT_NAME] as any).children
                ? (Vanil.slots![SLOT_DEFAULT_NAME] as IVirtualNode).children
                : // handling the else case when only a single child
                  // has been assigned before
                  [Vanil.slots![SLOT_DEFAULT_NAME]]
            }

            Vanil.slots![SLOT_DEFAULT_NAME] = {
              type: 'fragment',
              children: [...prevChildren, child],
            }
          }
        })
      }
    }
  }
  return props
}
