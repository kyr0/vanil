import { basename, dirname } from 'path'
import { getDefaultHookConfig } from '../config/hook'
import { getHooksFolder, toProjectRootRelativePath } from '../io/folders'
import { Context } from '../../@types/context'
import fg from 'fast-glob'
import { copyPublicToDist } from './core/copyPublicToDist'
import { genManifestJson } from './core/genManifestJson'
import { genRobotsTxt } from './core/genRobotsTxt'
import { genServiceWorker } from './core/genServiceWorker'
import { genSitemapXml } from './core/genSitemapXml'
import { copyPanicOverlayToDist } from './core/copyPanicOverlayToDist'
import { readFileSyncUtf8 } from '../io/file'
import { transpileSSGCode } from '../transform/transpile'
import { run } from '../transform/vm'

/** each hook is called with stage-specific props (e.g. page hooks receive page props) and the context */
export type HookFn = (context: Context, props?: any) => Promise<void>

export type HookStage = 'onContext' | 'onDevServerStart' | 'onStart' | 'onBeforePage' | 'onAfterPage' | 'onFinish'

export const HOOK_NAMES = ['onContext', 'onDevServerStart', 'onStart', 'onBeforePage', 'onAfterPage', 'onFinish']

export interface HookRegistrations {
  initialized: boolean
  perStage: {
    [hookStage: string]: Array<HookFn>
  }
}

export const isHookName = (hookName: string) => HOOK_NAMES.indexOf(hookName) > -1

/** matches a file paths basename (file name) without extensions with an allowed hook name */
export const isHookFile = (path: string): boolean => {
  if (!path) return false

  const hookName = basename(path).split('.')[0]

  return isHookName(hookName)
}

export const registerHook = (context: Context, stage: HookStage, fn: HookFn) => {
  context.hooks!.perStage[stage].push(fn)
}

/** globs hooks in a projects hooks folder, requires them and registers valid hook functions  */
export const loadProjectHooks = async (context: Context) => {
  const hookFiles = fg.sync(`${getHooksFolder(context.config)}/*.{ts,jsm,js}`)

  if (hookFiles.length) {
    console.log(
      'Found custom project hooks:',
      hookFiles.map((hookFilePath) => toProjectRootRelativePath(hookFilePath, context.config)),
    )
  }

  for (let i = 0; i < hookFiles.length; i++) {
    const hookFile = hookFiles[i]

    if (isHookFile(hookFile)) {
      const hookFileDir = dirname(hookFile)
      const hookScript = transpileSSGCode(readFileSyncUtf8(hookFile), context, hookFileDir)
      const currentCwd = process.cwd()

      context.path = hookFileDir
      process.chdir(hookFileDir)
      const exportedSymbols = await run(hookScript, context)
      process.chdir(currentCwd)

      const hookStageNames = Object.keys(exportedSymbols.data as any)

      if (hookStageNames.length > 0) {
        hookStageNames.forEach((hookStageName) => {
          if (isHookName(hookStageName)) {
            console.log(`Custom hook "${hookStageName}" registered.`)

            registerHook(context, hookStageName as HookStage, (exportedSymbols.data as any)[hookStageName])
          }
        })
      }
    }
  }
}

/** registers core hooks to execute standard functionality */
export const loadCoreHooks = async (context: Context) => {
  await registerHook(context, 'onStart', copyPublicToDist)
  await registerHook(context, 'onStart', copyPanicOverlayToDist)

  await registerHook(context, 'onFinish', genManifestJson)
  await registerHook(context, 'onFinish', genRobotsTxt)
  await registerHook(context, 'onFinish', genServiceWorker)
  await registerHook(context, 'onFinish', genSitemapXml)
}

/** imports the hooks that may be found in a project */
export const registerHooks = async (context: Context) => {
  // skip hook registration in case it already happened
  if (!context.hooks!.initialized || isHookFile(context.path!)) {
    context.hooks = getDefaultHookConfig(context)

    await loadCoreHooks(context)
    await loadProjectHooks(context)

    context.hooks!.initialized = true
  }
}

/** run hooks assigned for a specific state */
export const runHooks = async (hookStage: HookStage, context: Context, props?: any) => {
  const hooksPerStage = context.hooks!.perStage[hookStage]

  for (let i = 0; i < hooksPerStage.length; i++) {
    await hooksPerStage[i](context, props)
  }
}
