import { Config } from '../@types/config'
import { watch } from 'chokidar'
import { resolve } from 'path'
import * as colors from 'kleur/colors'
import * as WebSocket from 'ws'
import { preview, printServerRunning } from './preview'
import { getExecutionMode } from '../core/config'
import { orchestrateTransformAll, orchestrateTransformSingle } from '../core/orchestrate'
import { Context } from '../@types/context'
import {
  getPublicFolder,
  isAstroPageTemplate,
  toDistFolderRelativePath,
  toProjectRootRelativePath,
} from '../core/io/folders'
import { debounce } from '../core/time/debounce'
import { copyPublicToDist } from '../core/hook/core/copyPublicToDist'
import { invalidateCache } from '../core/transform/cache'

const publicFolderChangeCopyDebounceMs = 25
const fileChangeDebounceMs = 30

export const triggerTransformAll = async (serverConfig: any, config: Config, devWebSocketServer: WebSocket.Server) =>
  await orchestrateTransformAll({
    config,
    command: 'dev',
    mode: getExecutionMode(),
    // register in context for onDevServerStart hooks to apply
    devServer: serverConfig.server,
    expressApp: serverConfig.app,
    devWebSocketServer,
  })

/**
 * dev HTTP server that watches for src folder changes and
 * informs connected webrowsers for when rebuilds of pages have happened
 */
export const dev = async (config: Config) => {
  // start preview HTTP server
  console.log('config', config.devOptions)
  const serverConfig = await preview(config, false)

  // create the /livereload endpoint via ws://
  const devWebSocketServer = new WebSocket.Server({
    server: serverConfig.server,
    host: config.devOptions?.hostname,
    path: '/livereload',
  })

  // listen for HTTP and WS connections
  serverConfig.server.listen(config.devOptions?.port, () => printServerRunning('DevServer', config))

  let context = await triggerTransformAll(serverConfig, config, devWebSocketServer)

  // [hmr] notify initial (initial transform, for connected clients)
  notifyChange(devWebSocketServer, context)

  // === watching for changes
  const projectDir = resolve(__dirname, '../../', config.projectRoot!)
  const projectDistDir = resolve(projectDir, config.dist!)
  const projectNodeModulesDir = resolve(projectDir, 'node_modules')

  // TODO: add excluded dirs to project config devServer as a flag
  const excludedFolders = [projectDistDir, projectNodeModulesDir]

  const isInExcludedFolder = (path: string): boolean => {
    let isExcluded = false
    excludedFolders.forEach((excludedFolder) => {
      if (path.indexOf(excludedFolder) > -1) {
        isExcluded = true
      }
    })
    return isExcluded
  }

  const handleFileChange = async (path: string) => {
    if (context.fileDependenciesToRestartOn!.indexOf(path) > -1) {
      console.log(colors.yellow(`> Re-transform all: ${toProjectRootRelativePath(path, config)} changed...`))
      context = await triggerTransformAll(serverConfig, config, devWebSocketServer)
      notifyChange(devWebSocketServer, context)
      return
    }

    // list of .astro files to retransform
    const astroTemplatesToTransform: Array<string> = []

    // pre-process fileDependencies:  transient .astro component -> .astro page dependencies
    if (context.fileDependencies![path]) {
      const dependentAstroPages = context.fileDependencies![path]

      dependentAstroPages.forEach((astroPageCandidate: string, index: number) => {
        // .astro component dependent to .astro component -> resolve top level .astro page template deps
        if (!isAstroPageTemplate(astroPageCandidate, config) && astroPageCandidate.endsWith('.astro')) {
          // actual astro page dependencies
          const astroPageDeps = context.fileDependencies![astroPageCandidate] || []

          // replace transient dependency
          dependentAstroPages.splice(index, astroPageDeps.length, ...astroPageDeps)
        }
      })
    }

    Object.keys(context.fileDependencies!).forEach((depFilePath: string) => {
      // some module imports doesn't come with a file extension and it's
      // good enough to not resolve those with expensive ops but just assume
      // we might need to rebuild stochastically valid dependencies
      if (path.startsWith(depFilePath)) {
        context.fileDependencies![depFilePath].forEach((astroFile) => {
          if (isAstroPageTemplate(astroFile, config) && astroTemplatesToTransform.indexOf(astroFile) === -1) {
            // invalidate the codeCache
            invalidateCache(context)

            // adds the .astro file to the list of .astro files
            // to re-transform when the file changed is an (in)direct
            // dependency of it
            astroTemplatesToTransform.push(astroFile)
          }
        })
      }
    })

    // if the file changed is an .astro template file and not yet part of the list
    // of .astro templates to retransform, add
    if (
      path.endsWith('.astro') &&
      isAstroPageTemplate(path, config) &&
      astroTemplatesToTransform.indexOf(path) === -1
    ) {
      astroTemplatesToTransform.push(path)
    } else if (path.endsWith('.astro')) {
      // .astro component case; clear component cache
      context.codeCache = {}
    }

    // walk thru all .astro templates that depend on the files changed
    // and retransform them
    for (let i = 0; i < astroTemplatesToTransform.length; i++) {
      // incrementally compile with file changed hint
      context = await orchestrateTransformSingle({
        ...context,
        config,
        command: 'dev',
        mode: getExecutionMode(),
        path: astroTemplatesToTransform[i],

        // in dev mode, dynamic routes pass multiple times
        // and the context is kept across transform runs,
        // whereas building permutations only happens when
        // no materialized path is set yet
        //materializedPath: undefined
      })
    }

    // [hmr] notify on change
    notifyChange(devWebSocketServer, context)
  }

  /** triggers file change handling, but debounced to we don't get too many re-transforms  */
  const handleFileChangeDebounced: (path: string) => void = debounce(handleFileChange, fileChangeDebounceMs)

  /** copies over public/** to dist/** on file change in public dir */
  const handlePublicDirFileOperationDebounced: (path: string) => void = debounce((path: string) => {
    if (path.startsWith(getPublicFolder(context.config))) {
      copyPublicToDist(context)
    }
  }, publicFolderChangeCopyDebounceMs /* ms, to prevent triggering the copy too many times */)

  // watch for file changes
  watch(`${projectDir}/**`).on('all', async (eventName: string, path: string) => {
    // public dir file operation happened, copy files to dist
    handlePublicDirFileOperationDebounced(path)

    // only watch out for changes and included directories
    if (eventName !== 'change' || isInExcludedFolder(path)) return

    handleFileChangeDebounced(path)
  })
}

/** inform all connected websocket clients about a change */
export const notifyChange = (devWebSocketServer: WebSocket.Server, context: Context) => {
  devWebSocketServer.clients.forEach((ws) => {
    const materializedHtmlFilePaths = context.materializedHtmlFilePaths![context.path!]

    if (!materializedHtmlFilePaths) return
    ws.send(
      JSON.stringify({
        operation: 'transform',
        paths: materializedHtmlFilePaths.map((matHtmlFilePath) =>
          toDistFolderRelativePath(matHtmlFilePath, context.config),
        ),
      }),
    )
  })
}

export const getLiveReloadUrl = (config: Config) =>
  `ws://${config.devOptions?.hostname}:${config.devOptions?.port}/livereload`
